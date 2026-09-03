package com.carenest.backend.repository;

import com.carenest.backend.entity.CameraDevice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CameraDeviceRepository extends JpaRepository<CameraDevice, Long> {

    List<CameraDevice> findByElderlyId(Long elderlyId);

    Optional<CameraDevice> findByDeviceSn(String deviceSn);

    List<CameraDevice> findByStatus(CameraDevice.CameraStatus status);

    boolean existsByDeviceSn(String deviceSn);

    @Query("select camera.id from CameraDevice camera where camera.accessToken is not null")
    List<Long> findIdsWithAccessToken();
}
