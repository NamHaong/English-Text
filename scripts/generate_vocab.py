import os
import re
import json
from pypdf import PdfReader

PDF_PATH = r"D:\APP IOS\The_Oxford_5000_by_CEFR_level.pdf"
OUT_JSON = r"D:\APP IOS\English Text\src\data\vocabulary.json"

# Curated base translations and IPA for Oxford vocabulary
# Covers core A1, A2, B1 and dictionary mapping for B2, C1 extracted from the PDF
DICTIONARY = {
    # B2 & C1 from Oxford PDF sample & mappings
    "absorb": {"ipa": "/əbˈzɔːb/", "vi": "hấp thụ, tiếp thu", "ex": "Plants absorb water and nutrients from the soil.", "exVi": "Cây cối hấp thụ nước và chất dinh dưỡng từ đất."},
    "abstract": {"ipa": "/ˈæbstrækt/", "vi": "trừu tượng", "ex": "Truth and beauty are abstract concepts.", "exVi": "Chân lý và vẻ đẹp là những khái niệm trừu tượng."},
    "accent": {"ipa": "/ˈæksent/", "vi": "giọng điệu, trọng âm", "ex": "He speaks with a slight French accent.", "exVi": "Anh ấy nói với một chút giọng Pháp."},
    "accidentally": {"ipa": "/ˌæksɪˈdentli/", "vi": "vô tình, tình cờ", "ex": "I accidentally deleted your files.", "exVi": "Tôi đã vô tình xóa các tệp của bạn."},
    "accommodate": {"ipa": "/əˈkɒmədeɪt/", "vi": "chứa được, cung cấp chỗ ở", "ex": "The hotel can accommodate up to 500 guests.", "exVi": "Khách sạn có thể chứa tới 500 khách."},
    "accomplish": {"ipa": "/əˈkʌmplɪʃ/", "vi": "hoàn thành, đạt được", "ex": "She accomplished all her goals this year.", "exVi": "Cô ấy đã đạt được tất cả mục tiêu trong năm nay."},
    "accountant": {"ipa": "/əˈkaʊntənt/", "vi": "kế toán viên", "ex": "Her brother is a certified public accountant.", "exVi": "Anh trai cô ấy là kế toán viên công chứng."},
    "accuracy": {"ipa": "/ˈækjərəsi/", "vi": "sự chính xác", "ex": "Check your calculations for accuracy.", "exVi": "Hãy kiểm tra lại độ chính xác của các phép tính."},
    "accurately": {"ipa": "/ˈækjərətli/", "vi": "một cách chính xác", "ex": "The report accurately reflects the current situation.", "exVi": "Bản báo cáo phản ánh chính xác tình hình hiện tại."},
    "acid": {"ipa": "/ˈæsɪd/", "vi": "axit, vị chua", "ex": "Citric acid is found in lemons and oranges.", "exVi": "Axit xitric được tìm thấy trong chanh và cam."},
    "activate": {"ipa": "/ˈæktɪveɪt/", "vi": "kích hoạt, khởi động", "ex": "You need a code to activate your account.", "exVi": "Bạn cần một mã để kích hoạt tài khoản của mình."},
    "addiction": {"ipa": "/əˈdɪkʃn/", "vi": "sự nghiện ngập", "ex": "Video game addiction is a growing problem.", "exVi": "Nghiện trò chơi điện tử là một vấn đề ngày càng tăng."},
    "additionally": {"ipa": "/əˈdɪʃənəli/", "vi": "ngoài ra, thêm vào đó", "ex": "Additionally, the company offers free gym membership.", "exVi": "Ngoài ra, công ty còn cung cấp thẻ tập gym miễn phí."},
    "adequate": {"ipa": "/ˈædɪkwət/", "vi": "đầy đủ, thỏa đáng", "ex": "The room had adequate space for two people.", "exVi": "Căn phòng có đủ không gian cho hai người."},
    "adjust": {"ipa": "/əˈdʒʌst/", "vi": "điều chỉnh, thích nghi", "ex": "It took some time to adjust to the new climate.", "exVi": "Mất một thời gian để thích nghi với khí hậu mới."},
    "affordable": {"ipa": "/əˈfɔːdəbl/", "vi": "giá cả phải chăng, vừa túi tiền", "ex": "They are building affordable housing for young families.", "exVi": "Họ đang xây dựng nhà ở vừa túi tiền cho các gia đình trẻ."},
    "agriculture": {"ipa": "/ˈæɡrɪkʌltʃə(r)/", "vi": "nông nghiệp", "ex": "Agriculture plays a vital role in the country's economy.", "exVi": "Nông nghiệp đóng vai trò quan trọng trong nền kinh tế đất nước."},
    "alien": {"ipa": "/ˈeɪliən/", "vi": "người ngoài hành tinh, xa lạ", "ex": "The movie is about an alien visiting Earth.", "exVi": "Bộ phim nói về một người ngoài hành tinh đến thăm Trái đất."},
    "altogether": {"ipa": "/ˌɔːltəˈɡeðə(r)/", "vi": "hoàn toàn, tổng cộng", "ex": "The train stopped altogether.", "exVi": "Đoàn tàu đã dừng hẳn lại."},
    "ambulance": {"ipa": "/ˈæmbjələns/", "vi": "xe cứu thương", "ex": "Call an ambulance immediately!", "exVi": "Hãy gọi xe cứu thương ngay lập tức!"},
    "amusing": {"ipa": "/əˈmjuːzɪŋ/", "vi": "hài hước, vui nhộn", "ex": "He told an amusing story about his dog.", "exVi": "Anh ấy kể một câu chuyện vui nhộn về chú chó của mình."},
    "analyst": {"ipa": "/ˈænəlɪst/", "vi": "nhà phân tích", "ex": "She works as a financial analyst in Tokyo.", "exVi": "Cô ấy làm việc như một nhà phân tích tài chính ở Tokyo."},
    "ancestor": {"ipa": "/ˈænsestə(r)/", "vi": "tổ tiên", "ex": "Her ancestors came to America two centuries ago.", "exVi": "Tổ tiên của cô ấy đã đến Mỹ hai thế kỷ trước."},
    "animation": {"ipa": "/ˌænɪˈmeɪʃn/", "vi": "hoạt hình, sự sôi nổi", "ex": "Japanese animation has fans all over the world.", "exVi": "Phim hoạt hình Nhật Bản có người hâm mộ khắp thế giới."},
    "annually": {"ipa": "/ˈænjuəli/", "vi": "hàng năm", "ex": "The festival is held annually in July.", "exVi": "Lễ hội được tổ chức hàng năm vào tháng Bảy."},
    "anticipate": {"ipa": "/ænˈtɪsɪpeɪt/", "vi": "dự đoán, lường trước", "ex": "We anticipate a large crowd at the concert.", "exVi": "Chúng tôi dự đoán sẽ có một đám đông lớn tại buổi hòa nhạc."},
    "anxiety": {"ipa": "/æŋˈzaɪəti/", "vi": "sự lo lắng, bồn chồn", "ex": "She felt a wave of anxiety before the interview.", "exVi": "Cô cảm thấy một làn sóng lo lắng trước cuộc phỏng vấn."},
    "apologize": {"ipa": "/əˈpɒlədʒaɪz/", "vi": "xin lỗi", "ex": "He apologized for arriving late.", "exVi": "Anh ấy đã xin lỗi vì đến muộn."},
    "applaud": {"ipa": "/əˈplɔːd/", "vi": "vỗ tay khen ngợi", "ex": "The audience applauded enthusiastically.", "exVi": "Khán giả vỗ tay nhiệt tình."},
    "appropriate": {"ipa": "/əˈprəʊpriət/", "vi": "thích hợp, phù hợp", "ex": "Wear clothes appropriate for the weather.", "exVi": "Hãy mặc quần áo phù hợp với thời tiết."},
    "approve": {"ipa": "/əˈpruːv/", "vi": "tán thành, phê duyệt", "ex": "The board approved the new proposal.", "exVi": "Ban giám đốc đã phê duyệt đề xuất mới."},
    "architect": {"ipa": "/ˈɑːkɪtekt/", "vi": "kiến trúc sư", "ex": "The modern building was designed by a famous architect.", "exVi": "Tòa nhà hiện đại được thiết kế bởi một kiến trúc sư nổi tiếng."},
    "architecture": {"ipa": "/ˈɑːkɪtektʃə(r)/", "vi": "kiến trúc", "ex": "I love the colonial architecture of the city.", "exVi": "Tôi yêu thích kiến trúc thuộc địa của thành phố."},
    "artificial": {"ipa": "/ˌɑːtɪˈfɪʃl/", "vi": "nhân tạo", "ex": "Artificial intelligence is changing the world.", "exVi": "Trí tuệ nhân tạo đang làm thay đổi thế giới."},
    "artistic": {"ipa": "/ɑːˈtɪstɪk/", "vi": "thuộc về nghệ thuật, có khiếu nghệ thuật", "ex": "She has a lot of artistic talent.", "exVi": "Cô ấy có nhiều năng khiếu nghệ thuật."},
    "ashamed": {"ipa": "/əˈʃeɪmd/", "vi": "xấu hổ", "ex": "He felt ashamed of his rude behavior.", "exVi": "Anh ấy cảm thấy xấu hổ vì hành vi thô lỗ của mình."},
    "aspect": {"ipa": "/ˈæspekt/", "vi": "khía cạnh, phương diện", "ex": "We need to consider every aspect of the problem.", "exVi": "Chúng ta cần xem xét mọi khía cạnh của vấn đề."},
    "assess": {"ipa": "/əˈses/", "vi": "đánh giá, định giá", "ex": "The teacher will assess your progress every week.", "exVi": "Giáo viên sẽ đánh giá sự tiến bộ của bạn mỗi tuần."},
    "assessment": {"ipa": "/əˈsesmənt/", "vi": "sự đánh giá, bài kiểm tra", "ex": "Risk assessment is crucial before investing.", "exVi": "Đánh giá rủi ro là điều cốt yếu trước khi đầu tư."},
    "associate": {"ipa": "/əˈsəʊʃieɪt/", "vi": "liên kết, cộng tác", "ex": "Most people associate summer with holidays.", "exVi": "Hầu hết mọi người liên tưởng mùa hè với các kỳ nghỉ."},
    "associated": {"ipa": "/əˈsəʊʃieɪtɪd/", "vi": "liên quan, gắn liền", "ex": "There are high costs associated with this treatment.", "exVi": "Có những chi phí cao liên quan đến phương pháp điều trị này."},
    "association": {"ipa": "/əˌsəʊʃiˈeɪʃn/", "vi": "hiệp hội, sự kết hợp", "ex": "She joined the international student association.", "exVi": "Cô ấy đã tham gia hiệp hội sinh viên quốc tế."},
    "assume": {"ipa": "/əˈsjuːm/", "vi": "cho rằng, giả định", "ex": "Don't assume anything without checking the facts.", "exVi": "Đừng cho rằng điều gì mà không kiểm tra thực tế."},
    "assumption": {"ipa": "/əˈsʌmpʃn/", "vi": "giả định, giả thiết", "ex": "His plan was based on a false assumption.", "exVi": "Kế hoạch của anh ấy dựa trên một giả định sai lầm."},
    "astonishing": {"ipa": "/əˈstɒnɪʃɪŋ/", "vi": "kinh ngạc, đáng kinh ngạc", "ex": "She ran with astonishing speed.", "exVi": "Cô ấy chạy với tốc độ đáng kinh ngạc."},
    "athlete": {"ipa": "/ˈæθliːt/", "vi": "vận động viên", "ex": "Olympic athletes train for years.", "exVi": "Các vận động viên Olympic tập luyện trong nhiều năm."},
    "atmosphere": {"ipa": "/ˈætməsfɪə(r)/", "vi": "bầu không khí, khí quyển", "ex": "The restaurant has a friendly, cozy atmosphere.", "exVi": "Nhà hàng có bầu không khí thân thiện và ấm cúng."},
    "attachment": {"ipa": "/əˈtætʃmənt/", "vi": "tệp đính kèm, sự gắn bó", "ex": "Please find the invoice in the email attachment.", "exVi": "Vui lòng xem hóa đơn trong tệp đính kèm email."},
    "attempt": {"ipa": "/əˈtempt/", "vi": "nỗ lực, cố gắng", "ex": "She made a brave attempt to climb the mountain.", "exVi": "Cô ấy đã nỗ lực dũng cảm để leo lên ngọn núi."},
    "attend": {"ipa": "/əˈtend/", "vi": "tham dự, có mặt", "ex": "Are you going to attend the seminar tomorrow?", "exVi": "Bạn có định tham dự buổi hội thảo ngày mai không?"},
    "attitude": {"ipa": "/ˈætɪtjuːd/", "vi": "thái độ, quan điểm", "ex": "A positive attitude helps overcome obstacles.", "exVi": "Thái độ tích cực giúp vượt qua các trở ngại."},
    "attract": {"ipa": "/əˈtrækt/", "vi": "thu hút, hấp dẫn", "ex": "The beach resort attracts thousands of tourists.", "exVi": "Khu nghỉ dưỡng bãi biển thu hút hàng ngàn du khách."},
    "attractive": {"ipa": "/əˈtræktɪv/", "vi": "hấp dẫn, quyến rũ", "ex": "She offered an attractive discount on the course.", "exVi": "Cô ấy đã đưa ra mức giảm giá hấp dẫn cho khóa học."},
    "audience": {"ipa": "/ˈɔːdiəns/", "vi": "khán giả, thính giả", "ex": "The audience stood up and cheered.", "exVi": "Khán giả đứng dậy và reo hò."},
    "authentic": {"ipa": "/ɔːˈθentɪk/", "vi": "đích thực, xác thực", "ex": "This restaurant serves authentic Italian pizza.", "exVi": "Nhà hàng này phục vụ bánh pizza Ý đích thực."},
    "authority": {"ipa": "/ɔːˈθɒrəti/", "vi": "thẩm quyền, chính quyền", "ex": "He has the authority to sign the contract.", "exVi": "Anh ấy có thẩm quyền ký hợp đồng."},
    "automate": {"ipa": "/ˈɔːtəmeɪt/", "vi": "tự động hóa", "ex": "We can automate this process using simple software.", "exVi": "Chúng ta có thể tự động hóa quy trình này bằng phần mềm đơn giản."},
    "automatic": {"ipa": "/ˌɔːtəˈmætɪk/", "vi": "tự động", "ex": "The door has an automatic sensor.", "exVi": "Cửa có cảm biến tự động."},
    "automatically": {"ipa": "/ˌɔːtəˈmætɪkli/", "vi": "một cách tự động", "ex": "The light turns on automatically when someone enters.", "exVi": "Đèn tự động bật khi có người bước vào."},
    "available": {"ipa": "/əˈveɪləbl/", "vi": "có sẵn, rảnh rỗi", "ex": "Is this seat available?", "exVi": "Chỗ ngồi này còn trống không?"},
    "average": {"ipa": "/ˈævərɪdʒ/", "vi": "trung bình", "ex": "His test scores were above average.", "exVi": "Điểm kiểm tra của anh ấy trên mức trung bình."},
    "avoid": {"ipa": "/əˈvɔɪd/", "vi": "tránh, né tránh", "ex": "Try to avoid eating junk food late at night.", "exVi": "Hãy cố gắng tránh ăn đồ ăn vặt vào đêm muộn."},
    "aware": {"ipa": "/əˈweə(r)/", "vi": "nhận thức, biết được", "ex": "Are you aware of the new company policy?", "exVi": "Bạn có nhận thức được chính sách mới của công ty không?"},
    "awareness": {"ipa": "/əˈweənəs/", "vi": "nhận thức, sự hiểu biết", "ex": "The campaign aims to raise environmental awareness.", "exVi": "Chiến dịch nhằm nâng cao nhận thức về môi trường."},
    "awkward": {"ipa": "/ˈɔːkwəd/", "vi": "vụng về, ngượng ngùng", "ex": "There was an awkward silence after the question.", "exVi": "Có một sự im lặng ngượng ngùng sau câu hỏi."},
    "barrier": {"ipa": "/ˈbæriə(r)/", "vi": "rào cản, chướng ngại", "ex": "Language can be a barrier to communication.", "exVi": "Ngôn ngữ có thể là rào cản trong giao tiếp."},
    "beneficial": {"ipa": "/ˌbenɪˈfɪʃl/", "vi": "có lợi, mang lại lợi ích", "ex": "Regular exercise is beneficial for health.", "exVi": "Tập thể dục thường xuyên có lợi cho sức khỏe."},
    "benefit": {"ipa": "/ˈbenɪfɪt/", "vi": "lợi ích, được lợi", "ex": "The scholarship is a huge benefit for students.", "exVi": "Học bổng là một lợi ích to lớn cho sinh viên."},
    "beverage": {"ipa": "/ˈbevərɪdʒ/", "vi": "đồ uống, thức uống", "ex": "Hot beverages are served on the terrace.", "exVi": "Đồ uống nóng được phục vụ trên sân hiên."},
    "billion": {"ipa": "/ˈbɪljən/", "vi": "tỷ", "ex": "The project costs over one billion dollars.", "exVi": "Dự án có chi phí hơn một tỷ đô la."},
    "boost": {"ipa": "/buːst/", "vi": "tăng cường, thúc đẩy", "ex": "Coffee helped boost my energy levels.", "exVi": "Cà phê giúp tăng cường năng lượng cho tôi."},
    "boundary": {"ipa": "/ˈbaʊndri/", "vi": "ranh giới, biên giới", "ex": "Rivers often form natural boundaries between countries.", "exVi": "Các con sông thường tạo thành ranh giới tự nhiên giữa các quốc gia."},
    "breathtaking": {"ipa": "/ˈbreθteɪkɪŋ/", "vi": "đẹp ngoạn mục, choáng ngợp", "ex": "The view from the top of the mountain was breathtaking.", "exVi": "Khung cảnh từ đỉnh núi đẹp ngoạn mục."},
    "broadcast": {"ipa": "/ˈbrɔːdkɑːst/", "vi": "phát sóng, truyền thanh", "ex": "The news is broadcast live every evening.", "exVi": "Bản tin được phát sóng trực tiếp mỗi tối."},
    "budget": {"ipa": "/ˈbʌdʒɪt/", "vi": "ngân sách", "ex": "We must plan our budget carefully for the trip.", "exVi": "Chúng ta phải lập kế hoạch ngân sách cẩn thận cho chuyến đi."},
    "burden": {"ipa": "/ˈbɜːdn/", "vi": "gánh nặng", "ex": "Financial stress can be a heavy burden.", "exVi": "Căng thẳng tài chính có thể là một gánh nặng lớn."},
    "campaign": {"ipa": "/kæmˈpeɪn/", "vi": "chiến dịch", "ex": "The marketing campaign boosted our sales by 30%.", "exVi": "Chiến dịch tiếp thị đã tăng doanh số của chúng tôi thêm 30%."},
    "candidate": {"ipa": "/ˈkændɪdət/", "vi": "ứng viên, thí sinh", "ex": "She is the strongest candidate for the position.", "exVi": "Cô ấy là ứng viên sáng giá nhất cho vị trí này."},
    "capacity": {"ipa": "/kəˈpæsəti/", "vi": "sức chứa, năng lực", "ex": "The stadium was filled to capacity.", "exVi": "Sân vận động đã chứa đầy sức chứa tối đa."},
    "capture": {"ipa": "/ˈkæptʃə(r)/", "vi": "bắt giữ, ghi lại, nắm bắt", "ex": "The camera captured the stunning sunset.", "exVi": "Chiếc máy ảnh đã ghi lại cảnh hoàng hôn tuyệt đẹp."},
    "category": {"ipa": "/ˈkætəɡəri/", "vi": "danh mục, thể loại", "ex": "Books are organized by category in the library.", "exVi": "Sách được sắp xếp theo thể loại trong thư viện."},
    "celebrity": {"ipa": "/səˈlebrəti/", "vi": "người nổi tiếng", "ex": "She became an overnight celebrity on social media.", "exVi": "Cô trở thành người nổi tiếng sau một đêm trên mạng xã hội."},
    "challenge": {"ipa": "/ˈtʃælɪndʒ/", "vi": "thử thách, thách thức", "ex": "Learning a new language is an exciting challenge.", "exVi": "Học một ngôn ngữ mới là một thử thách thú vị."},
    "characteristic": {"ipa": "/ˌkærəktəˈrɪstɪk/", "vi": "đặc điểm, đặc tính", "ex": "Kindness is her most notable characteristic.", "exVi": "Lòng tốt là đặc điểm đáng chú ý nhất của cô ấy."},
    "chemical": {"ipa": "/ˈkemɪkl/", "vi": "hóa chất, thuộc hóa học", "ex": "Store hazardous chemicals in a secure cabinet.", "exVi": "Bảo quản hóa chất độc hại trong tủ an toàn."},
    "circumstance": {"ipa": "/ˈsɜːkəmstəns/", "vi": "hoàn cảnh, tình huống", "ex": "Under no circumstances should you open this door.", "exVi": "Trong bất kỳ hoàn cảnh nào bạn cũng không được mở cánh cửa này."},
    "citizen": {"ipa": "/ˈsɪtɪzn/", "vi": "công dân", "ex": "Every citizen has the right to vote.", "exVi": "Mọi công dân đều có quyền bỏ phiếu."},
    "civilization": {"ipa": "/ˌsɪvəlaɪˈzeɪʃn/", "vi": "nền văn minh", "ex": "Ancient Egyptian civilization is fascinating.", "exVi": "Nền văn minh Ai Cập cổ đại rất hấp dẫn."},
    "clarify": {"ipa": "/ˈklærəfaɪ/", "vi": "làm rõ, giải thích rõ", "ex": "Could you clarify the second point for me?", "exVi": "Bạn có thể làm rõ điểm thứ hai cho tôi được không?"},
    "classic": {"ipa": "/ˈklæsɪk/", "vi": "kinh điển, cổ điển", "ex": "This movie is a timeless classic.", "exVi": "Bộ phim này là một tác phẩm kinh điển vượt thời gian."},
    "climate": {"ipa": "/ˈklaɪmət/", "vi": "khí hậu", "ex": "Climate change is affecting our planet.", "exVi": "Biến đổi khí hậu đang ảnh hưởng đến hành tinh của chúng ta."},
    "collaborate": {"ipa": "/kəˈlæbəreɪt/", "vi": "hợp tác, phối hợp", "ex": "Two universities collaborated on the research project.", "exVi": "Hai trường đại học đã hợp tác trong dự án nghiên cứu."},
    "collapse": {"ipa": "/kəˈlæps/", "vi": "sụp đổ, đổ sập", "ex": "The old bridge collapsed during the storm.", "exVi": "Cây cầu cũ đã bị sụp đổ trong cơn bão."},
    "colleague": {"ipa": "/ˈkɒliːɡ/", "vi": "đồng nghiệp", "ex": "I had lunch with my colleagues today.", "exVi": "Hôm nay tôi đã ăn trưa với các đồng nghiệp của mình."},
    "combination": {"ipa": "/ˌkɒmbɪˈneɪʃn/", "vi": "sự kết hợp", "ex": "The salad is a great combination of flavors.", "exVi": "Món salad là sự kết hợp tuyệt vời của các hương vị."},
    "comfort": {"ipa": "/ˈkʌmfət/", "vi": "sự thoải mái, an ủi", "ex": "A hot cup of tea brings great comfort in winter.", "exVi": "Một tách trà nóng đem lại sự dễ chịu tuyệt vời vào mùa đông."},
    "command": {"ipa": "/kəˈmɑːnd/", "vi": "ra lệnh, quyền chỉ huy", "ex": "He has excellent command of English.", "exVi": "Anh ấy có khả năng làm chủ tiếng Anh xuất sắc."},
    "commercial": {"ipa": "/kəˈmɜːʃl/", "vi": "thương mại, quảng cáo", "ex": "The commercial district is full of vibrant shops.", "exVi": "Khu thương mại tràn ngập các cửa hàng sôi động."},
    "commit": {"ipa": "/kəˈmɪt/", "vi": "cam kết, thực hiện", "ex": "She committed herself to studying two hours a day.", "exVi": "Cô ấy cam kết dành hai giờ mỗi ngày để học."},
    "commitment": {"ipa": "/kəˈmɪtmənt/", "vi": "sự cam kết, trách nhiệm", "ex": "Success requires dedication and commitment.", "exVi": "Thành công đòi hỏi sự cống hiến và cam kết."},
    "community": {"ipa": "/kəˈmjuːnəti/", "vi": "cộng đồng", "ex": "Volunteers help build a stronger community.", "exVi": "Các tình nguyện viên giúp xây dựng một cộng đồng vững mạnh hơn."},
    "companion": {"ipa": "/kəmˈpænjən/", "vi": "bạn đồng hành", "ex": "A loyal dog is man's best companion.", "exVi": "Một chú chó trung thành là người bạn đồng hành tốt nhất của con người."},
    "comparative": {"ipa": "/kəmˈpærətɪv/", "vi": "so sánh, tương đối", "ex": "They made a comparative analysis of the two products.", "exVi": "Họ đã thực hiện một phân tích so sánh giữa hai sản phẩm."},
    "compensate": {"ipa": "/ˈkɒmpenseɪt/", "vi": "bồi thường, bù đắp", "ex": "The airline compensated passengers for the delay.", "exVi": "Hãng hàng không đã bồi thường cho hành khách vì sự chậm trễ."},
    "compete": {"ipa": "/kəmˈpiːt/", "vi": "cạnh tranh, thi đấu", "ex": "Athletes compete for gold medals.", "exVi": "Các vận động viên thi đấu để giành huy chương vàng."},
    "competitor": {"ipa": "/kəmˈpetɪtə(r)/", "vi": "đối thủ cạnh tranh", "ex": "Our competitor launched a similar feature last week.", "exVi": "Đối thủ của chúng tôi đã ra mắt một tính năng tương tự vào tuần trước."},
    "complex": {"ipa": "/ˈkɒmpleks/", "vi": "phức tạp", "ex": "The human brain is an incredibly complex system.", "exVi": "Bộ não con người là một hệ thống cực kỳ phức tạp."},
    "complicate": {"ipa": "/ˈkɒmplɪkeɪt/", "vi": "làm phức tạp", "ex": "Bad weather will complicate our travel plans.", "exVi": "Thời tiết xấu sẽ làm phức tạp kế hoạch di chuyển của chúng ta."},
    "component": {"ipa": "/kəmˈpəʊnənt/", "vi": "thành phần, bộ phận", "ex": "Key components of the engine need replacement.", "exVi": "Các bộ phận then chốt của động cơ cần được thay thế."},
    "compose": {"ipa": "/kəmˈpəʊz/", "vi": "soạn thảo, sáng tác", "ex": "He composed a beautiful symphony.", "exVi": "Ông đã sáng tác một bản giao hưởng tuyệt đẹp."},
    "composition": {"ipa": "/ˌkɒmpəˈzɪʃn/", "vi": "tác phẩm, thành phần cấu tạo", "ex": "The teacher praised her essay composition.", "exVi": "Giáo viên khen ngợi bài văn của cô ấy."},
    "comprehensive": {"ipa": "/ˌkɒmprɪˈhensɪv/", "vi": "toàn diện, bao quát", "ex": "This guide provides a comprehensive overview of the topic.", "exVi": "Hướng dẫn này cung cấp cái nhìn tổng quan toàn diện về chủ đề."},
    "compromise": {"ipa": "/ˈkɒmprəmaɪz/", "vi": "thỏa hiệp", "ex": "Both sides reached an amicable compromise.", "exVi": "Cả hai bên đã đạt được một sự thỏa hiệp êm đẹp."},
    "concentrate": {"ipa": "/ˈkɒnsntreɪt/", "vi": "tập trung", "ex": "I need quiet to concentrate on my study.", "exVi": "Tôi cần sự yên tĩnh để tập trung vào việc học."},
    "concept": {"ipa": "/ˈkɒnsept/", "vi": "khái niệm, ý tưởng", "ex": "She explained the core concept in simple terms.", "exVi": "Cô ấy giải thích khái niệm cốt lõi bằng những từ ngữ đơn giản."},
    "conclude": {"ipa": "/kənˈkluːd/", "vi": "kết luận, kết thúc", "ex": "The speaker concluded his talk with a memorable quote.", "exVi": "Diễn giả đã kết thúc bài nói của mình bằng một câu trích dẫn đáng nhớ."},
    "concrete": {"ipa": "/ˈkɒŋkriːt/", "vi": "bê tông, cụ thể", "ex": "Give me a concrete example of this problem.", "exVi": "Hãy cho tôi một ví dụ cụ thể về vấn đề này."},
    "conduct": {"ipa": "/kənˈdʌkt/", "vi": "tiến hành, chỉ đạo", "ex": "Scientists conduct experiments in the laboratory.", "exVi": "Các nhà khoa học tiến hành các thí nghiệm trong phòng thí nghiệm."},
    "confident": {"ipa": "/ˈkɒnfɪdənt/", "vi": "tự tin", "ex": "Speak in a clear and confident voice.", "exVi": "Hãy nói bằng giọng rõ ràng và tự tin."},
    "conflict": {"ipa": "/ˈkɒnflɪkt/", "vi": "xung đột, mâu thuẫn", "ex": "Communication can help resolve family conflicts.", "exVi": "Giao tiếp có thể giúp giải quyết những mâu thuẫn trong gia đình."},
    "confuse": {"ipa": "/kənˈfjuːz/", "vi": "làm bối rối, nhầm lẫn", "ex": "The two similar words often confuse learners.", "exVi": "Hai từ tương tự nhau thường làm người học bối rối."},
    "consequence": {"ipa": "/ˈkɒnsɪkwəns/", "vi": "hậu quả, hệ quả", "ex": "Think about the consequences before making a decision.", "exVi": "Hãy suy nghĩ về hậu quả trước khi đưa ra quyết định."},
    "conservative": {"ipa": "/kənˈsɜːvətɪv/", "vi": "bảo thủ, thận trọng", "ex": "He has a conservative approach to investing.", "exVi": "Anh ấy có cách tiếp cận thận trọng trong đầu tư."},
    "considerable": {"ipa": "/kənˈsɪdərəbl/", "vi": "đáng kể, to lớn", "ex": "She made a considerable improvement in English.", "exVi": "Cô ấy đã có sự tiến bộ đáng kể trong môn tiếng Anh."},
    "consistent": {"ipa": "/kənˈsɪstənt/", "vi": "nhất quán, kiên định", "ex": "Consistent practice leads to language fluency.", "exVi": "Luyện tập nhất quán sẽ dẫn đến sự lưu loát ngôn ngữ."},
    "constant": {"ipa": "/ˈkɒnstənt/", "vi": "liên tục, không đổi", "ex": "The machine requires constant temperature control.", "exVi": "Cỗ máy đòi hỏi sự kiểm soát nhiệt độ liên tục."},
    "construct": {"ipa": "/kənˈstrʌkt/", "vi": "xây dựng, kiến tạo", "ex": "They plan to construct a new library downtown.", "exVi": "Họ dự định xây dựng một thư viện mới ở trung tâm thành phố."},
    "consume": {"ipa": "/kənˈsjuːm/", "vi": "tiêu thụ, dùng", "ex": "People consume more water during hot summers.", "exVi": "Mọi người tiêu thụ nhiều nước hơn trong những mùa hè nóng nực."},
    "contemporary": {"ipa": "/kənˈtemprəri/", "vi": "đương đại, hiện đại", "ex": "She enjoys collecting contemporary art pieces.", "exVi": "Cô thích sưu tầm các tác phẩm nghệ thuật đương đại."},
    "contrast": {"ipa": "/ˈkɒntrɑːst/", "vi": "sự tương phản, đối chiếu", "ex": "There is a sharp contrast between day and night temperatures.", "exVi": "Có sự tương phản rõ rệt giữa nhiệt độ ngày và đêm."},
    "contribute": {"ipa": "/kənˈtrɪbjuːt/", "vi": "đóng góp, góp phần", "ex": "Volunteers contribute greatly to community success.", "exVi": "Các tình nguyện viên đóng góp rất nhiều vào thành công của cộng đồng."},
    "convenient": {"ipa": "/kənˈviːniənt/", "vi": "tiện lợi, thuận tiện", "ex": "Online shopping is very fast and convenient.", "exVi": "Mua sắm trực tuyến rất nhanh chóng và thuận tiện."},
    "convince": {"ipa": "/kənˈvɪns/", "vi": "thuyết phục", "ex": "She managed to convince her parents to support her dream.", "exVi": "Cô ấy đã thuyết phục được cha mẹ ủng hộ ước mơ của mình."},
    "cooperate": {"ipa": "/kəʊˈɒpəreɪt/", "vi": "hợp tác", "ex": "Countries must cooperate to fight global pollution.", "exVi": "Các quốc gia phải hợp tác để chống lại ô nhiễm toàn cầu."},
    "crucial": {"ipa": "/ˈkruːʃl/", "vi": "cực kỳ quan trọng, cốt yếu", "ex": "Early preparation is crucial for exam success.", "exVi": "Chuẩn bị sớm là yếu tố cốt yếu để đạt thành tích thi cử tốt."},
    "curiosity": {"ipa": "/ˌkjʊəriˈɒsəti/", "vi": "sự tò mò, hiếu kỳ", "ex": "Children have natural curiosity about the world.", "exVi": "Trẻ em có sự tò mò tự nhiên về thế giới xung quanh."},
    "debate": {"ipa": "/dɪˈbeɪt/", "vi": "tranh luận, cuộc tranh luận", "ex": "The students held a lively debate on climate policies.", "exVi": "Các sinh viên đã tổ chức một cuộc tranh luận sôi nổi về chính sách khí hậu."},
    "decade": {"ipa": "/ˈdekeɪd/", "vi": "thập kỷ (10 năm)", "ex": "Technology has changed rapidly over the past decade.", "exVi": "Công nghệ đã thay đổi nhanh chóng trong suốt thập kỷ qua."},
    "declare": {"ipa": "/dɪˈkleə(r)/", "vi": "tuyên bố, khai báo", "ex": "The president declared a state of emergency.", "exVi": "Tổng thống đã tuyên bố tình trạng khẩn cấp."},
    "decrease": {"ipa": "/dɪˈkriːs/", "vi": "giảm bớt, suy giảm", "ex": "Traffic noise decreased late at night.", "exVi": "Tiếng ồn giao thông đã giảm bớt vào đêm muộn."},
    "dedicate": {"ipa": "/ˈdedɪkeɪt/", "vi": "cống hiến, dành riêng", "ex": "She dedicated her life to helping orphans.", "exVi": "Cô đã cống hiến cuộc đời mình để giúp đỡ các em nhỏ mồ côi."},
    "defend": {"ipa": "/dɪˈfend/", "vi": "bảo vệ, phòng thủ", "ex": "The lawyer fought hard to defend his client.", "exVi": "Luật sư đã chiến đấu hết mình để bảo vệ thân chủ."},
    "definitely": {"ipa": "/ˈdefɪnətli/", "vi": "chắc chắn, dứt khoát", "ex": "I will definitely join you for dinner tomorrow.", "exVi": "Tôi chắc chắn sẽ đi ăn tối cùng bạn vào ngày mai."},
    "deliberate": {"ipa": "/dɪˈlɪbərət/", "vi": "cố ý, thận trọng", "ex": "It was a deliberate attempt to mislead voters.", "exVi": "Đó là một nỗ lực cố ý nhằm đánh lừa các cử tri."},
    "delicate": {"ipa": "/ˈdelɪkət/", "vi": "tinh tế, mỏng manh", "ex": "Handle these delicate glasses with care.", "exVi": "Hãy cầm những chiếc ly thủy tinh mỏng manh này thật cẩn thận."},
    "demonstrate": {"ipa": "/ˈdemənstreɪt/", "vi": "chứng minh, giải thích", "ex": "The teacher demonstrated how the experiment works.", "exVi": "Giáo viên đã làm mẫu cách thí nghiệm hoạt động."},
    "deny": {"ipa": "/dɪˈnaɪ/", "vi": "từ chối, phủ nhận", "ex": "The official denied all allegations of corruption.", "exVi": "Quan chức này đã phủ nhận tất cả các cáo buộc tham nhũng."},
    "depress": {"ipa": "/dɪˈpres/", "vi": "làm chán nản, suy thoái", "ex": "Rainy gloomy days always depress him.", "exVi": "Những ngày mưa ảm đạm luôn làm anh ấy chán nản."},
    "deserve": {"ipa": "/dɪˈzɜːv/", "vi": "xứng đáng", "ex": "You deserve a restful holiday after all that hard work.", "exVi": "Bạn xứng đáng có một kỳ nghỉ ngơi sau tất cả những vất vả đó."},
    "desperate": {"ipa": "/ˈdespərət/", "vi": "tuyệt vọng, liều mạng", "ex": "The refugees were in desperate need of food and shelter.", "exVi": "Những người tị nạn đang rất cần thức ăn và chỗ ở trong tuyệt vọng."},
    "destination": {"ipa": "/ˌdestɪˈneɪʃn/", "vi": "điểm đến", "ex": "Da Nang is a popular tourist destination in Vietnam.", "exVi": "Đà Nẵng là một điểm đến du lịch nổi tiếng ở Việt Nam."},
    "detect": {"ipa": "/dɪˈtekt/", "vi": "phát hiện, dò tìm", "ex": "The security system detected motion near the window.", "exVi": "Hệ thống an ninh đã phát hiện chuyển động gần cửa sổ."},
    "determine": {"ipa": "/dɪˈtɜːmɪn/", "vi": "xác định, quyết định", "ex": "Hard work and mindset determine your success.", "exVi": "Sự chăm chỉ và tư duy quyết định sự thành công của bạn."},
    "devote": {"ipa": "/dɪˈvəʊt/", "vi": "dành hết cho, cống hiến", "ex": "He devotes his weekends to family activities.", "exVi": "Anh ấy dành trọn những ngày cuối tuần cho các hoạt động gia đình."},
    "differ": {"ipa": "/ˈdɪfə(r)/", "vi": "khác biệt, bất đồng", "ex": "Opinions differ greatly on this political topic.", "exVi": "Ý kiến khác nhau rất nhiều về chủ đề chính trị này."},
    "dilemma": {"ipa": "/daɪˈlemə/", "vi": "thế tiến thoái lưỡng nan", "ex": "She faced a painful moral dilemma.", "exVi": "Cô ấy phải đối mặt với một tình thế tiến thoái lưỡng nan đầy đau đớn."},
    "dimension": {"ipa": "/daɪˈmenʃn/", "vi": "chiều hướng, kích thước", "ex": "The new feature adds a whole new dimension to the app.", "exVi": "Tính năng mới thêm một chiều hướng hoàn toàn mới vào ứng dụng."},
    "disaster": {"ipa": "/dɪˈzɑːstə(r)/", "vi": "thảm họa, thiên tai", "ex": "Rescue teams were sent to help after the disaster.", "exVi": "Các đội cứu hộ đã được cử đến để giúp đỡ sau thảm họa."},
    "discipline": {"ipa": "/ˈdɪsəplɪn/", "vi": "kỷ luật, rèn luyện", "ex": "Self-discipline is key to mastering any skill.", "exVi": "Tính tự kỷ luật là chìa khóa để làm chủ bất kỳ kỹ năng nào."},
    "distinguish": {"ipa": "/dɪˈstɪŋɡwɪʃ/", "vi": "phân biệt, nhận diện", "ex": "Can you distinguish between identical twins?", "exVi": "Bạn có thể phân biệt được cặp sinh đôi cùng trứng không?"},
    "distribute": {"ipa": "/dɪˈstrɪbjuːt/", "vi": "phân phát, phân phối", "ex": "Charity workers distributed food to homeless people.", "exVi": "Các nhân viên từ thiện đã phân phát thức ăn cho người vô gia cư."},
    "diverse": {"ipa": "/daɪˈvɜːs/", "vi": "đa dạng, phong phú", "ex": "New York is famous for its diverse cultural population.", "exVi": "New York nổi tiếng với dân số văn hóa đa dạng."},
    "diversity": {"ipa": "/daɪˈvɜːsəti/", "vi": "sự đa dạng", "ex": "Biodiversity is essential for healthy ecosystems.", "exVi": "Đa dạng sinh học là điều cần thiết cho các hệ sinh thái khỏe mạnh."},
    "dominate": {"ipa": "/ˈdɒmɪneɪt/", "vi": "thống trị, áp đảo", "ex": "The champion team dominated the entire match.", "exVi": "Đội vô địch đã áp đảo toàn bộ trận đấu."},
    "dramatic": {"ipa": "/drəˈmætɪk/", "vi": "đột ngột, ấn tượng, kịch tính", "ex": "There was a dramatic drop in temperature overnight.", "exVi": "Nhiệt độ đã giảm đột ngột chỉ sau một đêm."},
    "dynamic": {"ipa": "/daɪˈnæmɪk/", "vi": "năng động, linh hoạt", "ex": "She is a dynamic leader with fresh inspiring ideas.", "exVi": "Cô ấy là một nhà lãnh đạo năng động với những ý tưởng truyền cảm hứng mới mẻ."},
    "eager": {"ipa": "/ˈiːɡə(r)/", "vi": "háo hức, tha thiết", "ex": "Students were eager to start their summer vacation.", "exVi": "Học sinh háo hức bắt đầu kỳ nghỉ hè."},
    "elaborate": {"ipa": "/ɪˈlæbərət/", "vi": "tỉ mỉ, công phu", "ex": "They prepared an elaborate feast for the wedding.", "exVi": "Họ đã chuẩn bị một bữa tiệc công phu cho đám cưới."},
    "element": {"ipa": "/ˈelɪmənt/", "vi": "yếu tố, nguyên tố", "ex": "Trust is a fundamental element of any friendship.", "exVi": "Sự tin tưởng là một yếu tố nền tảng của mọi tình bạn."},
    "eliminate": {"ipa": "/ɪˈlɪmɪneɪt/", "vi": "loại bỏ, khử", "ex": "The doctor advised him to eliminate sugar from his diet.", "exVi": "Bác sĩ khuyên anh nên loại bỏ đường khỏi chế độ ăn."},
    "embarrassed": {"ipa": "/ɪmˈbærəst/", "vi": "ngượng ngùng, xấu hổ", "ex": "He felt embarrassed when he forgot her name.", "exVi": "Anh ấy cảm thấy xấu hổ khi quên tên cô ấy."},
    "emergency": {"ipa": "/iˈmɜːdʒənsi/", "vi": "tình trạng khẩn cấp", "ex": "Press this red button only in case of emergency.", "exVi": "Chỉ nhấn nút màu đỏ này trong trường hợp khẩn cấp."},
    "emotion": {"ipa": "/ɪˈməʊʃn/", "vi": "cảm xúc", "ex": "Music can evoke powerful emotions.", "exVi": "Âm nhạc có thể gợi lên những cảm xúc mãnh liệt."},
    "emphasize": {"ipa": "/ˈemfəsaɪz/", "vi": "nhấn mạnh", "ex": "The teacher emphasized the importance of regular review.", "exVi": "Giáo viên nhấn mạnh tầm quan trọng của việc ôn tập thường xuyên."},
    "encounter": {"ipa": "/ɪnˈkaʊntə(r)/", "vi": "chạm trán, bắt gặp", "ex": "We encountered unexpected difficulties during the hike.", "exVi": "Chúng tôi đã gặp phải những khó khăn bất ngờ trong chuyến đi bộ đường dài."},
    "encourage": {"ipa": "/ɪnˈkʌrɪdʒ/", "vi": "khuyến khích, động viên", "ex": "My parents always encouraged me to pursue my dreams.", "exVi": "Cha mẹ luôn khuyến khích tôi theo đuổi ước mơ."},
    "endure": {"ipa": "/ɪnˈdjʊə(r)/", "vi": "chịu đựng, bền bỉ", "ex": "True love can endure any hardship.", "exVi": "Tình yêu đích thực có thể vượt qua mọi gian khổ."},
    "enhance": {"ipa": "/ɪnˈhɑːns/", "vi": "nâng cao, tăng cường", "ex": "Reading books helps enhance your vocabulary.", "exVi": "Đọc sách giúp nâng cao vốn từ vựng của bạn."},
    "enormous": {"ipa": "/ɪˈnɔːməs/", "vi": "to lớn, khổng lồ", "ex": "The elephant had an enormous appetite.", "exVi": "Con voi có sức ăn khổng lồ."},
    "ensure": {"ipa": "/ɪnˈʃʊə(r)/", "vi": "đảm bảo, chắc chắn", "ex": "Please double check to ensure your door is locked.", "exVi": "Vui lòng kiểm tra lại để đảm bảo cửa nhà bạn đã khóa."},
    "enthusiastic": {"ipa": "/ɪnˌθjuːziˈæstɪk/", "vi": "nhiệt tình, hào hứng", "ex": "He gave an enthusiastic presentation to the team.", "exVi": "Anh ấy đã có một bài thuyết trình đầy nhiệt huyết trước nhóm."},
    "environment": {"ipa": "/ɪnˈvaɪrənmənt/", "vi": "môi trường", "ex": "We must work together to protect the natural environment.", "exVi": "Chúng ta phải cùng nhau hành động để bảo vệ môi trường tự nhiên."},
    "essential": {"ipa": "/ɪˈsenʃl/", "vi": "thiết yếu, cốt lõi", "ex": "Water and sleep are essential for human life.", "exVi": "Nước và giấc ngủ là thiết yếu cho sự sống con người."},
    "establish": {"ipa": "/ɪˈstæblɪʃ/", "vi": "thành lập, thiết lập", "ex": "The university was established in 1980.", "exVi": "Trường đại học được thành lập vào năm 1980."},
    "estimate": {"ipa": "/ˈestɪmeɪt/", "vi": "ước tính, ước lượng", "ex": "Experts estimate the repair will take three days.", "exVi": "Các chuyên gia ước tính việc sửa chữa sẽ mất ba ngày."},
    "evaluate": {"ipa": "/ɪˈvæljueɪt/", "vi": "đánh giá, định lượng", "ex": "Teachers evaluate students based on essays and exams.", "exVi": "Giáo viên đánh giá học sinh dựa trên bài luận và bài thi."},
    "evident": {"ipa": "/ˈevɪdənt/", "vi": "rõ ràng, hiển nhiên", "ex": "It was evident that she had practiced very hard.", "exVi": "Điều hiển nhiên là cô ấy đã luyện tập rất chăm chỉ."},
    "evolution": {"ipa": "/ˌiːvəˈluːʃn/", "vi": "sự tiến hóa, phát triển", "ex": "The book explores the evolution of modern smartphones.", "exVi": "Cuốn sách khám phá sự tiến hóa của điện thoại thông minh hiện đại."},
    "exaggerate": {"ipa": "/ɪɡˈzædʒəreɪt/", "vi": "phóng đại, thổi phồng", "ex": "Don't exaggerate the difficulty of the task.", "exVi": "Đừng phóng đại độ khó của nhiệm vụ này."},
    "exceptional": {"ipa": "/ɪkˈsepʃənl/", "vi": "xuất chúng, đặc biệt", "ex": "She has an exceptional memory for vocabulary.", "exVi": "Cô ấy có một trí nhớ xuất chúng về từ vựng."},
    "expand": {"ipa": "/ɪkˈspænd/", "vi": "mở rộng, phát triển", "ex": "The company hopes to expand into international markets.", "exVi": "Công ty hy vọng mở rộng sang các thị trường quốc tế."},
    "expectation": {"ipa": "/ˌekspekˈteɪʃn/", "vi": "kỳ vọng, mong đợi", "ex": "The movie exceeded all my expectations.", "exVi": "Bộ phim đã vượt qua mọi kỳ vọng của tôi."},
    "expense": {"ipa": "/ɪkˈspens/", "vi": "chi phí, phí tổn", "ex": "Living expenses in capital cities are often high.", "exVi": "Chi phí sinh hoạt ở các thủ đô thường khá cao."},
    "expertise": {"ipa": "/ˌekspɜːˈtiːz/", "vi": "chuyên môn, sự thành thạo", "ex": "We hired a consultant for their legal expertise.", "exVi": "Chúng tôi thuê chuyên gia tư vấn vì chuyên môn pháp lý của họ."},
    "explicit": {"ipa": "/ɪkˈsplɪsɪt/", "vi": "rõ ràng, dứt khoát", "ex": "The instructor gave explicit guidelines for the test.", "exVi": "Người hướng dẫn đã đưa ra các chỉ dẫn rõ ràng cho bài thi."},
    "explore": {"ipa": "/ɪkˈsplɔː(r)/", "vi": "khám phá, thám hiểm", "ex": "Travelers love to explore hidden alleys in old cities.", "exVi": "Khách du lịch thích khám phá những con hẻm khuất ở các thành phố cổ."},
    "extend": {"ipa": "/ɪkˈstend/", "vi": "kéo dài, mở rộng", "ex": "The professor agreed to extend the deadline by a week.", "exVi": "Giáo sư đã đồng ý kéo dài hạn nộp thêm một tuần."},
    "extraordinary": {"ipa": "/ɪkˈstrɔːdnri/", "vi": "phi thường, khác thường", "ex": "She possesses an extraordinary talent for playing piano.", "exVi": "Cô ấy sở hữu một tài năng phi thường trong việc chơi đàn piano."},
}

# A1 & A2 Core Vocabulary Essentials
A1_WORDS = [
    {"word": "apple", "pos": "n.", "ipa": "/ˈæpl/", "vi": "quả táo", "level": "A1", "ex": "I eat an apple every morning.", "exVi": "Tôi ăn một quả táo mỗi sáng."},
    {"word": "book", "pos": "n.", "ipa": "/bʊk/", "vi": "quyển sách", "level": "A1", "ex": "She is reading an interesting book.", "exVi": "Cô ấy đang đọc một cuốn sách thú vị."},
    {"word": "cat", "pos": "n.", "ipa": "/kæt/", "vi": "con mèo", "level": "A1", "ex": "The cute cat is sleeping on the sofa.", "exVi": "Chú mèo dễ thương đang ngủ trên ghế sofa."},
    {"word": "dog", "pos": "n.", "ipa": "/dɒɡ/", "vi": "con chó", "level": "A1", "ex": "My dog loves to run in the park.", "exVi": "Chú chó của tôi thích chạy trong công viên."},
    {"word": "eat", "pos": "v.", "ipa": "/iːt/", "vi": "ăn", "level": "A1", "ex": "Let's eat lunch together today.", "exVi": "Hôm nay chúng ta hãy cùng ăn trưa nhé."},
    {"word": "family", "pos": "n.", "ipa": "/ˈfæməli/", "vi": "gia đình", "level": "A1", "ex": "Family is the most important thing in life.", "exVi": "Gia đình là điều quan trọng nhất trong cuộc sống."},
    {"word": "good", "pos": "adj.", "ipa": "/ɡʊd/", "vi": "tốt, giỏi", "level": "A1", "ex": "Have a good day at school!", "exVi": "Chúc một ngày tốt lành ở trường nhé!"},
    {"word": "happy", "pos": "adj.", "ipa": "/ˈhæpi/", "vi": "vui vẻ, hạnh phúc", "level": "A1", "ex": "Seeing your smile makes me happy.", "exVi": "Nhìn thấy nụ cười của bạn làm tôi hạnh phúc."},
    {"word": "house", "pos": "n.", "ipa": "/haʊs/", "vi": "ngôi nhà", "level": "A1", "ex": "They live in a beautiful little house.", "exVi": "Họ sống trong một ngôi nhà nhỏ xinh xắn."},
    {"word": "learn", "pos": "v.", "ipa": "/lɜːn/", "vi": "học tập", "level": "A1", "ex": "I want to learn English every day.", "exVi": "Tôi muốn học tiếng Anh mỗi ngày."},
    {"word": "water", "pos": "n.", "ipa": "/ˈwɔːtə(r)/", "vi": "nước", "level": "A1", "ex": "Drink plenty of water to stay healthy.", "exVi": "Hãy uống nhiều nước để giữ gìn sức khỏe."},
    {"word": "friend", "pos": "n.", "ipa": "/frend/", "vi": "bạn bè", "level": "A1", "ex": "A good friend is always there for you.", "exVi": "Một người bạn tốt luôn ở bên cạnh bạn."},
    {"word": "school", "pos": "n.", "ipa": "/skuːl/", "vi": "trường học", "level": "A1", "ex": "The school starts at eight in the morning.", "exVi": "Trường học bắt đầu lúc tám giờ sáng."},
    {"word": "time", "pos": "n.", "ipa": "/taɪm/", "vi": "thời gian, lần", "level": "A1", "ex": "Time flies when you are having fun.", "exVi": "Thời gian trôi rất nhanh khi bạn vui vẻ."},
    {"word": "work", "pos": "v., n.", "ipa": "/wɜːk/", "vi": "làm việc, công việc", "level": "A1", "ex": "She works very hard to achieve her dreams.", "exVi": "Cô ấy làm việc rất chăm chỉ để đạt được ước mơ."}
]

A2_WORDS = [
    {"word": "accident", "pos": "n.", "ipa": "/ˈæksɪdənt/", "vi": "tai nạn, sự cố", "level": "A2", "ex": "Drive safely to avoid an accident.", "exVi": "Hãy lái xe an toàn để tránh tai nạn."},
    {"word": "advice", "pos": "n.", "ipa": "/ədˈvaɪs/", "vi": "lời khuyên", "level": "A2", "ex": "Listen to your doctor's advice.", "exVi": "Hãy lắng nghe lời khuyên của bác sĩ."},
    {"word": "agree", "pos": "v.", "ipa": "/əˈɡriː/", "vi": "đồng ý, tán thành", "level": "A2", "ex": "I completely agree with your suggestion.", "exVi": "Tôi hoàn toàn đồng ý với gợi ý của bạn."},
    {"word": "arrive", "pos": "v.", "ipa": "/əˈraɪv/", "vi": "đến nơi", "level": "A2", "ex": "The flight will arrive at 7 PM.", "exVi": "Chuyến bay sẽ hạ cánh vào lúc 7 giờ tối."},
    {"word": "believe", "pos": "v.", "ipa": "/bɪˈliːv/", "vi": "tin tưởng", "level": "A2", "ex": "Believe in yourself and your abilities.", "exVi": "Hãy tin vào bản thân và năng lực của bạn."},
    {"word": "borrow", "pos": "v.", "ipa": "/ˈbɒrəʊ/", "vi": "mượn, vay", "level": "A2", "ex": "Can I borrow your pencil for a moment?", "exVi": "Tôi có thể mượn chiếc bút chì của bạn một lát được không?"},
    {"word": "celebrate", "pos": "v.", "ipa": "/ˈselɪbreɪt/", "vi": "kỷ niệm, ăn mừng", "level": "A2", "ex": "We gathered to celebrate her birthday.", "exVi": "Chúng tôi tụ họp để ăn mừng sinh nhật của cô ấy."},
    {"word": "decide", "pos": "v.", "ipa": "/dɪˈsaɪd/", "vi": "quyết định", "level": "A2", "ex": "It was difficult to decide which path to take.", "exVi": "Thật khó để quyết định nên chọn con đường nào."},
    {"word": "delicious", "pos": "adj.", "ipa": "/dɪˈlɪʃəs/", "vi": "thơm ngon", "level": "A2", "ex": "Vietnamese pho is absolutely delicious.", "exVi": "Phở Việt Nam thực sự rất ngon."},
    {"word": "famous", "pos": "adj.", "ipa": "/ˈfeɪməs/", "vi": "nổi tiếng", "level": "A2", "ex": "Paris is famous for the Eiffel Tower.", "exVi": "Paris nổi tiếng với tháp Eiffel."}
]

B1_WORDS = [
    {"word": "achieve", "pos": "v.", "ipa": "/əˈtʃiːv/", "vi": "đạt được, hoàn thành", "level": "B1", "ex": "Work persistently to achieve your goals.", "exVi": "Hãy làm việc kiên trì để đạt được mục tiêu của bạn."},
    {"word": "advantage", "pos": "n.", "ipa": "/ədˈvɑːntɪdʒ/", "vi": "lợi thế, ưu điểm", "level": "B1", "ex": "Fluency in English gives you a big advantage.", "exVi": "Thành thạo tiếng Anh mang lại cho bạn một lợi thế lớn."},
    {"word": "ambition", "pos": "n.", "ipa": "/æmˈbɪʃn/", "vi": "tham vọng, hoài bão", "level": "B1", "ex": "She has high ambition to become a top doctor.", "exVi": "Cô ấy có hoài bão lớn trở thành một bác sĩ hàng đầu."},
    {"word": "apology", "pos": "n.", "ipa": "/əˈpɒlədʒi/", "vi": "lời xin lỗi", "level": "B1", "ex": "He sent a sincere apology letter.", "exVi": "Anh ấy đã gửi một lá thư xin lỗi chân thành."},
    {"word": "brilliant", "pos": "adj.", "ipa": "/ˈbrɪliənt/", "vi": "tuyệt vời, rực rỡ, thông minh", "level": "B1", "ex": "What a brilliant idea to solve this issue!", "exVi": "Thật là một ý tưởng tuyệt vời để giải quyết vấn đề này!"},
    {"word": "confidence", "pos": "n.", "ipa": "/ˈkɒnfɪdəns/", "vi": "sự tự tin, lòng tin", "level": "B1", "ex": "Public speaking helped build his confidence.", "exVi": "Nói trước công chúng đã giúp xây dựng sự tự tin của anh ấy."},
    {"word": "curious", "pos": "adj.", "ipa": "/ˈkjʊəriəs/", "vi": "tò mò, hiếu kỳ", "level": "B1", "ex": "Curious minds always explore new horizons.", "exVi": "Những tâm trí hiếu kỳ luôn khám phá những chân trời mới."}
]

def clean_word_entry(raw_word):
    # console2 -> console
    cleaned = re.sub(r'\d+$', '', raw_word)
    # Extract parenthesized note if any: counter (argue against)
    sense = ""
    m = re.search(r'\((.*?)\)', cleaned)
    if m:
        sense = m.group(1).strip()
    clean_w = re.sub(r'\(.*?\)', '', cleaned).strip()
    return clean_w, sense

def parse_pdf():
    reader = PdfReader(PDF_PATH)
    full_text = ""
    for page in reader.pages:
        full_text += "\n" + page.extract_text()

    lines = [line.strip() for line in full_text.split('\n') if line.strip()]
    current_level = "B2"
    skip_phrases = ['Oxford University Press', 'The Oxford 5000', 'As well as the Oxford', '3000, it includes', 'which are listed here']
    
    entries = []
    seen = set()

    for line in lines:
        if line in ['B2', 'C1']:
            current_level = line
            continue
        if any(sp in line for sp in skip_phrases):
            continue
        m = re.match(r'^([a-zA-Z\s\-\'\/\d\(\)]+?)\s+(n\.|v\.|adj\.|adv\.|prep\.|conj\.|pron\.|det\.|num\.|number|exclam\.)(.*)$', line)
        if m:
            raw_w = m.group(1).strip()
            pos = (m.group(2) + m.group(3)).strip()
            word, sense = clean_word_entry(raw_w)
            
            key = f"{word}_{pos}"
            if key in seen:
                continue
            seen.add(key)

            # Check if we have defined dictionary info
            dict_info = DICTIONARY.get(word.lower(), None)
            if dict_info:
                ipa = dict_info["ipa"]
                meaning = dict_info["vi"]
                ex = dict_info["ex"]
                exVi = dict_info["exVi"]
            else:
                ipa = f"/{word}/"
                meaning = f"nghĩa của từ {word}" if not sense else f"{sense}"
                ex = f"This sentence illustrates the use of the word '{word}'."
                exVi = f"Câu này minh họa cách sử dụng của từ '{word}'."
            
            entries.append({
                "id": f"{current_level.lower()}-{len(entries)+1}",
                "word": word,
                "pos": pos,
                "ipa": ipa,
                "meaning": meaning,
                "level": current_level,
                "example": ex,
                "exampleVi": exVi,
                "sense": sense
            })

    return entries

def main():
    pdf_entries = parse_pdf()
    print(f"Extracted {len(pdf_entries)} entries from PDF.")

    all_vocab = []
    # Add A1, A2, B1
    for i, item in enumerate(A1_WORDS):
        item["id"] = f"a1-{i+1}"
        all_vocab.append(item)
    for i, item in enumerate(A2_WORDS):
        item["id"] = f"a2-{i+1}"
        all_vocab.append(item)
    for i, item in enumerate(B1_WORDS):
        item["id"] = f"b1-{i+1}"
        all_vocab.append(item)
    
    # Add PDF entries (B2, C1)
    all_vocab.extend(pdf_entries)

    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(all_vocab, f, ensure_ascii=False, indent=2)

    print(f"Total vocabulary dataset saved: {len(all_vocab)} words to {OUT_JSON}")

if __name__ == "__main__":
    main()
