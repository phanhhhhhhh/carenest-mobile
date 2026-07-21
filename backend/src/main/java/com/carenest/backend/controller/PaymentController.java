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
                    "name", "Free Plan",
                    "price", 0,
                    "features", List.of(
                        "Monitor 1 elderly profile",
                        "7-day data history",
                        "Basic health tracking",
                        "SOS alerts"
                    )
                ),
                Map.of(
                    "id", "PREMIUM_MONTHLY",
                    "name", "Premium Monthly",
                    "price", 49000,
                    "currency", "VND",
                    "features", List.of(
                        "Monitor multiple elderly profiles",
                        "Unlimited data history",
                        "AI Weekly Summary Reports",
                        "Export health reports as PDF",
                        "Priority support"
                    )
                ),
                Map.of(
                    "id", "PREMIUM_YEARLY",
                    "name", "Premium Yearly",
                    "price", 399000,
                    "currency", "VND",
                    "features", List.of(
                        "All Premium Monthly features",
                        "2 months free (save 17%)"
                    )
                )
            )
        ));
    }
}
