package com.carenest.backend.service;

import com.carenest.backend.entity.Subscription;
import com.carenest.backend.entity.User;
import com.carenest.backend.exception.NotFoundException;
import com.carenest.backend.repository.SubscriptionRepository;
import com.carenest.backend.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.text.SimpleDateFormat;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * UC-25: Premium Plan payment processing.
 * Supports VNPay and MoMo payment gateways.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;

    @Value("${payment.vnpay.tmn-code:}")
    private String vnpayTmnCode;

    @Value("${payment.vnpay.hash-secret:}")
    private String vnpayHashSecret;

    @Value("${payment.vnpay.pay-url:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}")
    private String vnpayPayUrl;

    @Value("${payment.vnpay.return-url:http://localhost:8080/api/payment/vnpay/return}")
    private String vnpayReturnUrl;

    @Value("${payment.momo.partner-code:}")
    private String momoPartnerCode;

    @Value("${payment.momo.access-key:}")
    private String momoAccessKey;

    @Value("${payment.momo.secret-key:}")
    private String momoSecretKey;

    @Value("${payment.momo.pay-url:https://test-payment.momo.vn/v2/gateway/api/create}")
    private String momoPayUrl;

    // Plans
    private static final BigDecimal PREMIUM_MONTHLY_PRICE = new BigDecimal("49000");  // 49,000 VND
    private static final BigDecimal PREMIUM_YEARLY_PRICE = new BigDecimal("399000");  // 399,000 VND

    /**
     * Create a VNPay payment URL for premium subscription.
     */
    @Transactional
    public Map<String, String> createVnpayPayment(Long userId, String planType, String clientIp) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("User not found"));

        Subscription.PlanType plan = Subscription.PlanType.valueOf(planType);
        BigDecimal amount = plan == Subscription.PlanType.PREMIUM_YEARLY
            ? PREMIUM_YEARLY_PRICE : PREMIUM_MONTHLY_PRICE;

        // Create pending subscription
        String txnRef = generateTxnRef(userId);
        Subscription sub = Subscription.builder()
            .user(user)
            .planType(plan)
            .status(Subscription.SubscriptionStatus.PENDING)
            .paymentProvider("VNPAY")
            .transactionId(txnRef)
            .amount(amount)
            .startDate(Instant.now())
            .build();
        subscriptionRepository.save(sub);

        // Build VNPay payment URL
        String paymentUrl = buildVnpayUrl(txnRef, amount, clientIp);
        log.info("VNPay payment URL created: userId={} txnRef={}", userId, txnRef);

        return Map.of(
            "paymentUrl", paymentUrl,
            "transactionId", txnRef,
            "amount", amount.toString(),
            "planType", planType
        );
    }

    /**
     * Handle VNPay return/redirect.
     * Verify signature, activate subscription if payment successful.
     */
    @Transactional
    public Map<String, String> handleVnpayReturn(Map<String, String> params) {
        String vnpSecureHash = params.get("vnp_SecureHash");
        // Remove hash params for verification
        Map<String, String> verifyParams = new HashMap<>(params);
        verifyParams.remove("vnp_SecureHash");
        verifyParams.remove("vnp_SecureHashType");

        String computedHash = hmacSHA512(vnpayHashSecret, buildVnpayQueryString(verifyParams));
        boolean valid = computedHash.equals(vnpSecureHash);

        if (!valid) {
            log.warn("VNPay return: invalid signature for txnRef={}", params.get("vnp_TxnRef"));
            return Map.of("status", "ERROR", "message", "Invalid signature");
        }

        String txnRef = params.get("vnp_TxnRef");
        String responseCode = params.get("vnp_ResponseCode");
        String txnStatus = params.get("vnp_TransactionStatus");

        if ("00".equals(responseCode) && "00".equals(txnStatus)) {
            activateSubscription(txnRef, "VNPAY");
            log.info("VNPay payment success: txnRef={}", txnRef);
            return Map.of("status", "SUCCESS", "message", "Payment successful — Premium activated!");
        } else {
            log.info("VNPay payment failed/cancelled: txnRef={} code={}", txnRef, responseCode);
            // Mark subscription as cancelled
            subscriptionRepository.findByTransactionId(txnRef).ifPresent(sub -> {
                sub.setStatus(Subscription.SubscriptionStatus.CANCELLED);
                subscriptionRepository.save(sub);
            });
            return Map.of("status", "FAILED", "message", "Payment failed or cancelled");
        }
    }

    /**
     * Handle VNPay IPN (Instant Payment Notification) callback.
     */
    @Transactional
    public Map<String, String> handleVnpayIpn(Map<String, String> params) {
        // Same verification as return, but for server-to-server callback
        return handleVnpayReturn(params);
    }

    /**
     * Create a MoMo payment request.
     */
    @Transactional
    public Map<String, String> createMomoPayment(Long userId, String planType) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("User not found"));

        Subscription.PlanType plan = Subscription.PlanType.valueOf(planType);
        BigDecimal amount = plan == Subscription.PlanType.PREMIUM_YEARLY
            ? PREMIUM_YEARLY_PRICE : PREMIUM_MONTHLY_PRICE;

        String orderId = generateTxnRef(userId);
        String requestId = UUID.randomUUID().toString();

        // Create pending subscription
        Subscription sub = Subscription.builder()
            .user(user)
            .planType(plan)
            .status(Subscription.SubscriptionStatus.PENDING)
            .paymentProvider("MOMO")
            .transactionId(orderId)
            .amount(amount)
            .startDate(Instant.now())
            .build();
        subscriptionRepository.save(sub);

        // Build MoMo request body
        try {
            String rawSignature = "accessKey=" + momoAccessKey
                + "&amount=" + amount
                + "&extraData="
                + "&ipnUrl=" + URLEncoder.encode(vnpayReturnUrl.replace("vnpay", "momo"), StandardCharsets.UTF_8)
                + "&orderId=" + orderId
                + "&orderInfo=" + URLEncoder.encode("CareNest Premium Subscription", StandardCharsets.UTF_8)
                + "&partnerCode=" + momoPartnerCode
                + "&redirectUrl=" + URLEncoder.encode(vnpayReturnUrl.replace("vnpay", "momo"), StandardCharsets.UTF_8)
                + "&requestId=" + requestId
                + "&requestType=captureWallet";

            String signature = hmacSHA256(momoSecretKey, rawSignature);

            log.info("MoMo payment created: userId={} orderId={}", userId, orderId);
            return Map.of(
                "payUrl", momoPayUrl,
                "orderId", orderId,
                "requestId", requestId,
                "amount", amount.toString(),
                "planType", planType,
                "signature", signature
            );
        } catch (Exception e) {
            log.error("Failed to create MoMo payment: {}", e.getMessage());
            throw new RuntimeException("Failed to create MoMo payment", e);
        }
    }

    /**
     * Handle MoMo return/callback (IPN).
     * Verifies the MoMo signature, checks resultCode, and activates subscription.
     */
    @Transactional
    public Map<String, String> handleMomoReturn(Map<String, String> params) {
        String receivedSignature = params.get("signature");

        // Verify signature
        String computedSignature = verifyMomoSignature(params);
        boolean valid = computedSignature != null && computedSignature.equals(receivedSignature);

        if (!valid) {
            log.warn("MoMo return: invalid signature for orderId={}", params.get("orderId"));
            return Map.of("status", "ERROR", "message", "Invalid MoMo signature");
        }

        String orderId = params.get("orderId");
        String resultCode = params.get("resultCode");
        String message = params.getOrDefault("message", "");

        if ("0".equals(resultCode)) {
            // Payment successful
            activateSubscription(orderId, "MOMO");
            log.info("MoMo payment success: orderId={}", orderId);
            return Map.of("status", "SUCCESS", "message", "Payment successful — Premium activated!");
        } else {
            // Payment failed
            log.info("MoMo payment failed: orderId={} resultCode={} message={}", orderId, resultCode, message);
            subscriptionRepository.findByTransactionId(orderId).ifPresent(sub -> {
                sub.setStatus(Subscription.SubscriptionStatus.CANCELLED);
                subscriptionRepository.save(sub);
            });
            return Map.of("status", "FAILED", "message", message.isBlank() ? "Payment failed" : message);
        }
    }

    /**
     * Verify MoMo signature using HMAC-SHA256.
     * MoMo signature string format:
     * accessKey={accessKey}&amount={amount}&extraData={extraData}&message={message}
     * &orderId={orderId}&orderInfo={orderInfo}&partnerCode={partnerCode}
     * &payType={payType}&requestId={requestId}&responseTime={responseTime}
     * &resultCode={resultCode}&transId={transId}
     */
    public String verifyMomoSignature(Map<String, String> params) {
        try {
            String rawSignature = "accessKey=" + momoAccessKey
                + "&amount=" + params.getOrDefault("amount", "")
                + "&extraData=" + params.getOrDefault("extraData", "")
                + "&message=" + params.getOrDefault("message", "")
                + "&orderId=" + params.getOrDefault("orderId", "")
                + "&orderInfo=" + params.getOrDefault("orderInfo", "")
                + "&partnerCode=" + params.getOrDefault("partnerCode", "")
                + "&payType=" + params.getOrDefault("payType", "")
                + "&requestId=" + params.getOrDefault("requestId", "")
                + "&responseTime=" + params.getOrDefault("responseTime", "")
                + "&resultCode=" + params.getOrDefault("resultCode", "")
                + "&transId=" + params.getOrDefault("transId", "");

            return hmacSHA256(momoSecretKey, rawSignature);
        } catch (Exception e) {
            log.error("MoMo signature verification failed: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Get current subscription status for a user.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getSubscriptionStatus(Long userId) {
        Optional<Subscription> activeSub = subscriptionRepository.findByUserIdAndStatus(
            userId, Subscription.SubscriptionStatus.ACTIVE);

        boolean isPremium = activeSub.isPresent() && activeSub.get().isPremium();

        return Map.of(
            "isPremium", isPremium,
            "planType", activeSub.map(s -> s.getPlanType().name()).orElse("FREE"),
            "expiresAt", activeSub.map(Subscription::getEndDate).orElse(null)
        );
    }

    /**
     * Check if a user has premium access. Used for feature gating.
     */
    @Transactional(readOnly = true)
    public boolean hasPremiumAccess(Long userId) {
        return subscriptionRepository.findByUserIdAndStatusAndPlanTypeIn(
            userId,
            Subscription.SubscriptionStatus.ACTIVE,
            List.of(Subscription.PlanType.PREMIUM_MONTHLY, Subscription.PlanType.PREMIUM_YEARLY)
        ).map(Subscription::isPremium).orElse(false);
    }

    /**
     * Cancel a premium subscription.
     */
    @Transactional
    public void cancelSubscription(Long userId) {
        subscriptionRepository.findByUserIdAndStatus(userId, Subscription.SubscriptionStatus.ACTIVE)
            .ifPresent(sub -> {
                sub.setStatus(Subscription.SubscriptionStatus.CANCELLED);
                sub.setCancelledAt(Instant.now());
                subscriptionRepository.save(sub);
                log.info("Subscription cancelled: userId={}", userId);
            });
    }

    // ── Private Helpers ─────────────────────────────────────────────────────

    private void activateSubscription(String txnRef, String provider) {
        subscriptionRepository.findByTransactionId(txnRef).ifPresent(sub -> {
            sub.setStatus(Subscription.SubscriptionStatus.ACTIVE);
            sub.setPaymentProvider(provider);
            // Set end date based on plan
            int months = sub.getPlanType() == Subscription.PlanType.PREMIUM_YEARLY ? 12 : 1;
            sub.setEndDate(Instant.now().plus(30L * months, ChronoUnit.DAYS));
            subscriptionRepository.save(sub);
        });
    }

    private String buildVnpayUrl(String txnRef, BigDecimal amount, String clientIp) {
        Map<String, String> vnpParams = new TreeMap<>();
        vnpParams.put("vnp_Version", "2.1.0");
        vnpParams.put("vnp_Command", "pay");
        vnpParams.put("vnp_TmnCode", vnpayTmnCode);
        vnpParams.put("vnp_Amount", String.valueOf(amount.multiply(new BigDecimal("100")).longValue())); // VND * 100
        vnpParams.put("vnp_CurrCode", "VND");
        vnpParams.put("vnp_TxnRef", txnRef);
        vnpParams.put("vnp_OrderInfo", "CareNest Premium Subscription");
        vnpParams.put("vnp_OrderType", "billpayment");
        vnpParams.put("vnp_Locale", "vn");
        vnpParams.put("vnp_ReturnUrl", vnpayReturnUrl);
        vnpParams.put("vnp_IpAddr", clientIp != null ? clientIp : "127.0.0.1");

        SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMddHHmmss");
        sdf.setTimeZone(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        String createDate = sdf.format(new Date());
        vnpParams.put("vnp_CreateDate", createDate);

        Calendar expire = Calendar.getInstance(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        expire.add(Calendar.MINUTE, 15);
        vnpParams.put("vnp_ExpireDate", sdf.format(expire.getTime()));

        String queryString = buildVnpayQueryString(vnpParams);
        String hash = hmacSHA512(vnpayHashSecret, queryString);

        return vnpayPayUrl + "?" + queryString + "&vnp_SecureHash=" + hash;
    }

    private String buildVnpayQueryString(Map<String, String> params) {
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            if (sb.length() > 0) sb.append("&");
            sb.append(entry.getKey()).append("=").append(entry.getValue());
        }
        return sb.toString();
    }

    private String generateTxnRef(Long userId) {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMddHHmmss");
        sdf.setTimeZone(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        int random = new SecureRandom().nextInt(90000) + 10000;
        return "CN" + sdf.format(new Date()) + "_" + userId + "_" + random;
    }

    // ── Crypto ─────────────────────────────────────────────────────────────

    private String hmacSHA512(String key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception e) {
            throw new RuntimeException("HMAC-SHA512 failed", e);
        }
    }

    private String hmacSHA256(String key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception e) {
            throw new RuntimeException("HMAC-SHA256 failed", e);
        }
    }
}
