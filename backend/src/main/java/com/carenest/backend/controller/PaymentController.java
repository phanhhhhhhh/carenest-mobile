package com.carenest.backend.controller;

import com.carenest.backend.dto.payment.PaymentInitResponse;
import com.carenest.backend.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    
    @PostMapping("/vnpay/create")
    @PreAuthorize("hasRole('FAMILY') and #userId == authentication.principal")
    public ResponseEntity<PaymentInitResponse> createVnpay(
        @AuthenticationPrincipal Long userId,
        @RequestBody Map<String, String> body,
        HttpServletRequest request
    ) {
        String planType = body.getOrDefault("planType", "PREMIUM_MONTHLY");
        String clientIp = request.getRemoteAddr();
        PaymentInitResponse result = paymentService.createVnpayPayment(userId, planType, clientIp);
        return ResponseEntity.ok(result);
    }

    
    @GetMapping("/vnpay/return")
    public ResponseEntity<Map<String, String>> vnpayReturn(HttpServletRequest request) {
        Map<String, String> params = new HashMap<>();
        request.getParameterMap().forEach((k, v) -> params.put(k, v[0]));
        Map<String, String> result = paymentService.handleVnpayReturn(params);
        return ResponseEntity.ok(result);
    }

    
    @PostMapping("/vnpay/ipn")
    public ResponseEntity<Map<String, String>> vnpayIpn(@RequestBody Map<String, String> params) {
        Map<String, String> result = paymentService.handleVnpayIpn(params);
        return ResponseEntity.ok(result);
    }


    @PostMapping("/momo/create")
    @PreAuthorize("hasRole('FAMILY') and #userId == authentication.principal")
    public ResponseEntity<PaymentInitResponse> createMomo(
        @AuthenticationPrincipal Long userId,
        @RequestBody Map<String, String> body
    ) {
        String planType = body.getOrDefault("planType", "PREMIUM_MONTHLY");
        PaymentInitResponse result = paymentService.createMomoPayment(userId, planType);
        return ResponseEntity.ok(result);
    }

    /** VietQR / NAPAS bank transfer — the spec's primary channel, reconciled manually (UC G3). */
    @PostMapping("/vietqr/create")
    @PreAuthorize("hasRole('FAMILY') and #userId == authentication.principal")
    public ResponseEntity<PaymentInitResponse> createVietQr(
        @AuthenticationPrincipal Long userId,
        @RequestBody Map<String, String> body
    ) {
        String planType = body.getOrDefault("planType", "PREMIUM_MONTHLY");
        return ResponseEntity.ok(paymentService.createVietQrPayment(userId, planType));
    }

    /** Operator list of payments awaiting manual reconciliation (UC G3). */
    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> pendingPayments() {
        return ResponseEntity.ok(paymentService.listPendingPayments());
    }

    /** Operator confirms a received VietQR transfer and activates Family Plus (UC G3). */
    @PostMapping("/vietqr/confirm")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> confirmVietQr(@RequestBody Map<String, String> body) {
        String txnRef = body.get("transactionId");
        return ResponseEntity.ok(paymentService.confirmManualPayment(txnRef));
    }

    
    @PostMapping("/momo/return")
    public ResponseEntity<Map<String, String>> momoReturn(@RequestBody Map<String, String> body) {
        Map<String, String> result = paymentService.handleMomoReturn(body);
        return ResponseEntity.ok(result);
    }

    
    @GetMapping("/subscription")
    @PreAuthorize("#userId == authentication.principal")
    public ResponseEntity<Map<String, Object>> getStatus(@AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(paymentService.getSubscriptionStatus(userId));
    }

    
    @PostMapping("/cancel")
    @PreAuthorize("hasRole('FAMILY') and #userId == authentication.principal")
    public ResponseEntity<Map<String, String>> cancel(@AuthenticationPrincipal Long userId) {
        paymentService.cancelSubscription(userId);
        return ResponseEntity.ok(Map.of("message", "Subscription cancelled"));
    }

    
    @GetMapping("/plans")
    public ResponseEntity<Map<String, Object>> getPlans() {
        return ResponseEntity.ok(Map.of(
            "plans", List.of(
                Map.of(
                    "id", "FREE",
                    "name", "Gói Miễn phí",
                    "price", 0,
                    "features", List.of(
                        "1 hồ sơ cha/mẹ, không giới hạn số con kết nối",
                        "Check-in, thuốc, SOS, camera trực tiếp, Nhắc Về Thăm",
                        "Family Feed lưu 7 ngày",
                        "Trò chuyện với trợ lý AI ~5 tin/ngày"
                    )
                ),
                Map.of(
                    "id", "PREMIUM_MONTHLY",
                    "name", "CareNest Family Plus",
                    "price", 49000,
                    "currency", "VND",
                    "features", List.of(
                        "Trò chuyện với trợ lý AI không giới hạn",
                        "Bản tin gia đình sâu hơn + tóm tắt tuần",
                        "Giọng nhắc thuốc tuỳ biến của người thân",
                        "Family Feed lưu trữ không giới hạn"
                    )
                ),
                Map.of(
                    "id", "PREMIUM_YEARLY",
                    "name", "CareNest Family Plus (năm)",
                    "price", 499000,
                    "currency", "VND",
                    "features", List.of(
                        "Toàn bộ quyền lợi Family Plus",
                        "Tiết kiệm ~15% so với trả theo tháng"
                    )
                )
            )
        ));
    }
}
