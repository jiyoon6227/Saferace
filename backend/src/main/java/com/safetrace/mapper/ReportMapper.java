package com.safetrace.mapper;

import com.safetrace.domain.Report;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ReportMapper {

    // 제보 등록 (성공 시 reportId가 파라미터 객체에 자동으로 채워짐)
    int insert(Report report);

    Report findById(@Param("reportId") Long reportId);

    // STAFF 화면 - 아직 어떤 Incident에도 연결 안 된 제보 목록 (제보 관리 탭에서 사용)
    List<Report> findUnlinked();

    // 시민 화면 - 내가 등록한 제보 목록 (내 제보 추적)
    List<Report> findByMemberId(@Param("memberId") Long memberId);

    // 제보를 특정 Incident에 연결 (제보 병합의 실제 실행 단계)
    int linkIncident(@Param("reportId") Long reportId, @Param("incidentId") Long incidentId);

    // STAFF 화면 - 특정 Incident에 묶인 제보 목록 ("연결된 제보" 표시용)
    List<Report> findByIncidentId(@Param("incidentId") Long incidentId);
}