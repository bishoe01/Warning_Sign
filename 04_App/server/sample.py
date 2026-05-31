"""샘플 응답 (앱의 sampleAnalysis.ts 와 동일 내용).
키가 없거나 실제 호출이 실패할 때 폴백으로 사용한다.
TODO: 실제 표준근로계약서 출처 + 사람이 검증한 정답 JSON 으로 교체."""
from models import AnalysisResult, CautionItem, Summary

SAMPLE_OCR_TEXT = "\n".join(
    [
        "표준근로계약서",
        "사업주(갑)와 근로자(을)는 다음과 같이 근로계약을 체결한다.",
        "1. 근로계약기간: 2026.06.01 ~ 2027.05.31 (수습기간 3개월)",
        "2. 근무장소: (주)한빛제조 김해공장",
        "3. 업무내용: 생산라인 보조",
        "4. 소정근로시간: 09:00 ~ 18:00 (휴게 12:00~13:00)",
        "5. 근무일/휴일: 주 5일 근무, 매주 일요일 휴무",
        "6. 임금: 월 2,060,740원 (기본급)",
        "7. 수습기간 중 임금: 수습기간(3개월) 동안 임금의 90%를 지급한다.",
        "8. 공제: 회사는 매월 임금에서 숙식비 200,000원을 공제한다.",
        "9. 연장근로: 업무상 필요 시 연장근로를 할 수 있다.",
        "10. 기타: 근로자가 1년 이내 퇴사할 경우 교육비 100만원을 반환한다.",
    ]
)

SAMPLE_RESULT = AnalysisResult(
    ocrText=SAMPLE_OCR_TEXT,
    summary=Summary(
        salary="월 2,060,740원 (기본급)",
        workHours="주 5일, 1일 8시간 (09:00~18:00, 휴게 1시간)",
        holiday="매주 일요일 (주휴일)",
        contractPeriod="2026.06.01 ~ 2027.05.31 (수습 3개월)",
        deduction="숙식비 월 200,000원 공제",
    ),
    cautionItems=[
        CautionItem(
            level="check",
            title="퇴사 시 위약금 조항",
            originalText="근로자가 1년 이내 퇴사할 경우 교육비 100만원을 반환한다.",
            explanationKo="정해진 기간 전에 일을 그만두면 돈을 내야 한다는 내용이에요. 이런 위약금 약정은 문제가 될 수 있으니, 서명 전에 꼭 확인하고 상담을 받아보세요.",
            explanationEn="This says you may have to pay money if you quit within a year. Penalty agreements like this can be a problem, so please check carefully and get advice before signing.",
            explanationVi="Điều khoản này nói rằng bạn có thể phải trả tiền nếu nghỉ việc trong vòng một năm. Thỏa thuận phạt như vậy có thể gây vấn đề, hãy kiểm tra kỹ và xin tư vấn trước khi ký.",
        ),
        CautionItem(
            level="review",
            title="숙식비 공제",
            originalText="회사는 매월 임금에서 숙식비 200,000원을 공제한다.",
            explanationKo="월급에서 숙소·식사 비용으로 매달 20만원을 빼요. 실제 제공되는 숙소·식사와 금액이 맞는지, 본인이 동의했는지 확인하세요.",
            explanationEn="200,000 KRW is deducted from your monthly pay for housing and meals. Check whether the amount matches what is actually provided and whether you agreed to it.",
            explanationVi="200.000 KRW bị trừ mỗi tháng cho chỗ ở và bữa ăn. Hãy kiểm tra xem số tiền có khớp với những gì thực sự được cung cấp và bạn có đồng ý hay không.",
        ),
        CautionItem(
            level="review",
            title="수습기간 임금",
            originalText="수습기간(3개월) 동안 임금의 90%를 지급한다.",
            explanationKo="처음 3개월(수습) 동안에는 월급의 90%만 받아요. 수습기간 길이와 감액 비율이 맞는지 확인하세요.",
            explanationEn="During the first 3 months (probation), you receive only 90% of the wage. Check that the probation length and the reduced rate are correct.",
            explanationVi="Trong 3 tháng đầu (thử việc), bạn chỉ nhận 90% lương. Hãy kiểm tra thời gian thử việc và tỷ lệ giảm có đúng không.",
        ),
        CautionItem(
            level="info",
            title="연장근로 가능성",
            originalText="업무상 필요 시 연장근로를 할 수 있다.",
            explanationKo="회사가 필요하면 추가 근무를 요청할 수 있다는 내용이에요. 연장근로를 하면 수당(통상임금의 1.5배)을 받는지 확인하세요.",
            explanationEn="The company may ask you to work overtime when needed. Make sure you receive overtime pay (1.5x your normal wage) for extra hours.",
            explanationVi="Công ty có thể yêu cầu bạn làm thêm giờ khi cần. Hãy đảm bảo bạn nhận được tiền làm thêm giờ (1,5 lần lương bình thường).",
        ),
    ],
    notice="이 분석은 법률 자문이 아니라 참고용 안내입니다. 중요한 계약은 서명 전에 전문가 상담을 권장합니다.",
)
