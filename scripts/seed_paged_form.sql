INSERT INTO tenant_d0bbcb6d_form.plg_form_definitions (
    id, tenant_id, slug, title_text, description, document, publish_status, captcha, accept_responses, latest_version
) VALUES (
    '921a5f82-3c1a-4d2b-9e4a-718293a4b5c6',
    'd0bbcb6d-fbc5-40fb-a3b2-bc93434ab3d9',
    'employee-feedback-paged',
    'Khảo Sát Ý Kiến & Đề Xuất Cải Tiến (Bố Cục Phân Trang - Page Layout)',
    'Biểu mẫu khảo sát nhân sự định kỳ theo dạng trang (Page Mode) với giao diện 2 cột hiện đại trên Desktop và tự động co giãn trên Mobile.',
    '{
      "title": "Khảo Sát Ý Kiến & Đề Xuất Cải Tiến (Bố Cục Phân Trang - Page Layout)",
      "description": "Biểu mẫu khảo sát nhân sự định kỳ theo dạng trang (Page Mode) với giao diện 2 cột hiện đại trên Desktop và tự động co giãn trên Mobile.",
      "layout": {
        "mode": "PAGE",
        "columns": 2,
        "row_gap": "normal"
      },
      "items": [
        {
          "type": "PAGE",
          "title": "Trang 1: Đơn Vị Công Tác & Đánh Giá Môi Trường",
          "description": "Vui lòng hoàn thành các thông tin cơ bản về phòng ban và môi trường làm việc."
        },
        {
          "ref": "department",
          "type": "DROPDOWN",
          "label": "Đơn vị / Phòng ban công tác",
          "required": true,
          "col_span": 1,
          "options": [
            {"value": "DEV", "label": "Phòng Phát triển Phần mềm"},
            {"value": "QA", "label": "Phòng Đảm bảo Chất lượng"},
            {"value": "HR", "label": "Phòng Nhân sự"},
            {"value": "SALES", "label": "Phòng Kinh doanh"}
          ]
        },
        {
          "ref": "role_title",
          "type": "SHORT_TEXT",
          "label": "Vị trí / Chức danh hiện tại",
          "required": true,
          "col_span": 1,
          "placeholder": "VD: Senior Frontend Engineer"
        },
        {
          "ref": "work_env_rating",
          "type": "RATING",
          "label": "Đánh giá không gian & môi trường làm việc",
          "required": true,
          "col_span": 1,
          "grading": {"points": 5}
        },
        {
          "ref": "team_collaboration",
          "type": "SINGLE_CHOICE",
          "label": "Mức độ phối hợp giữa các bộ phận",
          "required": true,
          "col_span": 1,
          "options": [
            {"value": "EXCELLENT", "label": "Rất gắn kết & nhanh chóng"},
            {"value": "GOOD", "label": "Tốt, thỉnh thoảng có độ trễ"},
            {"value": "NEEDS_IMPROVEMENT", "label": "Cần cải thiện quy trình"}
          ]
        },
        {
          "type": "PAGE",
          "title": "Trang 2: Đề Xuất Sáng Kiến & Định Hướng Phát Triển",
          "description": "Các ý kiến đóng góp nhằm cải tiến quy trình và nâng cao năng suất tổ chức."
        },
        {
          "ref": "suggested_tools",
          "type": "MULTI_CHOICE",
          "label": "Công cụ / Công nghệ mong muốn bổ sung",
          "col_span": 1,
          "options": [
            {"value": "AI_TOOLS", "label": "Công cụ AI Agent hỗ trợ lập trình"},
            {"value": "CI_CD", "label": "Hệ thống CI/CD tự động hóa cao"},
            {"value": "TRAINING", "label": "Khóa đào tạo chứng chỉ chuyên môn"}
          ]
        },
        {
          "ref": "contact_email",
          "type": "SHORT_TEXT",
          "label": "Email nhận phản hồi (Không bắt buộc)",
          "col_span": 1,
          "placeholder": "user@example.com"
        },
        {
          "ref": "detailed_feedback",
          "type": "LONG_TEXT",
          "label": "Đề xuất cải tiến chi tiết",
          "col_span": 2,
          "placeholder": "Mô tả cụ thể những điểm cần cải tiến trong quý tới..."
        }
      ]
    }'::jsonb,
    'PUBLISHED',
    'none',
    true,
    1
)
ON CONFLICT (tenant_id, slug) DO UPDATE SET
    title_text = EXCLUDED.title_text,
    description = EXCLUDED.description,
    document = EXCLUDED.document,
    publish_status = 'PUBLISHED',
    accept_responses = true,
    updated_at = now();
