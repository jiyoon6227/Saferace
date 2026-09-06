package com.safetrace.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;

// 현장제보에 첨부하는 사진을 서버 로컬 디스크(uploadDir)에 저장하고,
// 브라우저에서 바로 열어볼 수 있는 URL(/uploads/파일명)을 돌려준다.
// 실제 파일 서빙은 WebConfig의 addResourceHandlers가 처리.
//
// 주의: transferTo()에 상대경로를 그대로 넘기면 Tomcat이 자기 내부 임시
// 작업폴더 기준으로 다시 해석해버려서 "경로를 찾을 수 없음" 에러가 남.
// 그래서 절대경로로 바꾼 뒤, transferTo() 대신 스트림을 직접 복사한다.
@RestController
@RequestMapping("/api/uploads")
public class UploadController {

    @Value("${app.upload-dir}")
    private String uploadDir;

    @PostMapping
    public Map<String, String> upload(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("파일이 비어 있습니다.");
        }

        String original = file.getOriginalFilename();
        String ext = (original != null && original.contains("."))
                ? original.substring(original.lastIndexOf('.'))
                : "";
        String savedName = UUID.randomUUID() + ext;

        Path dirPath = Path.of(uploadDir).toAbsolutePath();
        Files.createDirectories(dirPath);
        Path target = dirPath.resolve(savedName);

        try (var in = file.getInputStream()) {
            Files.copy(in, target);
        }

        return Map.of("url", "/uploads/" + savedName);
    }
}