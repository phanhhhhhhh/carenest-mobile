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
                        "Theo dõi 1 hồ sơ người cao tuổi",
                        "Kết nối 1 tài khoản người thân",
                        "Lịch sử dữ liệu 7 ngày",
                        "Theo dõi sức khỏe cơ bản",
                        "Cảnh báo SOS khẩn cấp"
                    )
                ),
                Map.of(
                    "id", "PREMIUM_MONTHLY",
                    "name", "Premium Hàng tháng",
                    "price", 49000,
                    "currency", "VND",
                    "features", List.of(
                        "Theo dõi tối đa 4 người cao tuổi",
                        "Kết nối tối đa 6 tài khoản người thân",
                        "Lịch sử dữ liệu không giới hạn",
                        "Báo cáo tổng kết hàng tuần bằng AI",
                        "Xuất báo cáo sức khỏe dạng PDF",
                        "Hỗ trợ ưu tiên"
                    )
                ),
                Map.of(
                    "id", "PREMIUM_YEARLY",
                    "name", "Premium Hàng năm",
                    "price", 490000,
                    "currency", "VND",
                    "features", List.of(
                        "Đầy đủ tính năng gói Premium Hàng tháng",
                        "Tiết kiệm 17% (tặng 2 tháng sử dụng)"
                    )
                )
            )
        ));
    }
}
