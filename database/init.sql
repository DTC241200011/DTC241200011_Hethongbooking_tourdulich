-- ==============================================================================
-- Database Initialization Script for Tour Booking System (De 20)
-- Student: Phi Duc Phi - DTC241200011
-- ==============================================================================

CREATE TABLE IF NOT EXISTS tours (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    duration VARCHAR(50) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    max_participants INT DEFAULT 30,
    image_url TEXT,
    description TEXT,
    departure_location VARCHAR(100) DEFAULT 'Hà Nội / TP.HCM',
    transport VARCHAR(100) DEFAULT 'Xe du lịch đời mới / Máy bay',
    featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS itineraries (
    id SERIAL PRIMARY KEY,
    tour_id INT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    day_number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    meals VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    booking_code VARCHAR(20) UNIQUE NOT NULL,
    tour_id INT NOT NULL REFERENCES tours(id) ON DELETE RESTRICT,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    departure_date DATE NOT NULL,
    adults_count INT DEFAULT 1,
    children_count INT DEFAULT 0,
    total_price NUMERIC(12, 2) NOT NULL,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for performance optimization
CREATE INDEX IF NOT EXISTS idx_tours_destination ON tours(destination);
CREATE INDEX IF NOT EXISTS idx_tours_is_active ON tours(is_active);
CREATE INDEX IF NOT EXISTS idx_itineraries_tour_id ON itineraries(tour_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_code ON bookings(booking_code);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_tour_id ON bookings(tour_id);

-- Seed Data: Sample Tours
INSERT INTO tours (id, title, destination, duration, price, max_participants, image_url, description, departure_location, transport, featured)
VALUES
(1, 'Tour Đà Nẵng - Bán Đảo Sơn Trà - Bà Nà Hills - Hội An', 'Đà Nẵng', '4 Ngày 3 Đêm', 4890000, 30, 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&auto=format&fit=crop', 'Hành trình khám phá di sản miền Trung: Chiêm ngưỡng Cầu Vàng Bà Nà Hills, phố cổ Hội An lung linh đèn lồng và biển Mỹ Khê tuyệt đẹp.', 'Hà Nội / TP.HCM', 'Máy bay khứ hồi + Xe ô tô', true),
(2, 'Tour Nghỉ Dưỡng Phú Quốc - Grand World - Cáp Treo Hòn Thơm', 'Phú Quốc', '3 Ngày 2 Đêm', 5490000, 25, 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800&auto=format&fit=crop', 'Trải nghiệm thiên đường biển đảo Đảo Ngọc, ngắm hoàng hôn Sunset Sanato, vui chơi không ngủ tại Grand World Phú Quốc.', 'Hà Nội / TP.HCM', 'Máy bay khứ hồi + Du thuyền', true),
(3, 'Tour Du Thuyền Vịnh Hạ Long 5 Sao - Hang Sửng Sốt - Đảo Ti Tốp', 'Hạ Long', '2 Ngày 1 Đêm', 3250000, 35, 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&auto=format&fit=crop', 'Thưởng ngoạn kỳ quan thiên nhiên thế giới trên du thuyền đẳng cấp, chèo thuyền Kayak và ngắm cảnh vịnh tuyệt sắc lúc bình minh.', 'Hà Nội', 'Xe Limousine Dcar VIP', true),
(4, 'Tour Sa Pa - Chinh Phục Đỉnh Fansipan - Bản Cát Cát', 'Sa Pa', '3 Ngày 2 Đêm', 2790000, 30, 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop', 'Chạm tay vào nóc nhà Đông Dương Fansipan, dạo bước giữa thung lũng Mường Hoa và trải nghiệm văn hóa độc đáo của người H’Mông.', 'Hà Nội', 'Xe Cabin Tình Yêu VIP', false),
(5, 'Tour Hà Giang Mùa Hoa Tam Giác Mạch - Đèo Mã Pí Lèng - Sông Nho Quế', 'Hà Giang', '3 Ngày 2 Đêm', 2950000, 20, 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop', 'Chinh phục một trong tứ đại đỉnh đèo hiểm trở nhất Việt Nam, đi thuyền ngắm trọn hẻm vực Tu Sản sâu nhất Đông Nam Á.', 'Hà Nội', 'Xe Universe Đời Mới', true),
(6, 'Tour Đà Lạt Thành Phố Ngàn Hoa - Đồi Chè Cầu Đất - Thác Datanla', 'Đà Lạt', '3 Ngày 2 Đêm', 3190000, 30, 'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=800&auto=format&fit=crop', 'Hít thở không khí se lạnh mộng mơ của Đà Lạt, check-in đồi chè mây bồng bềnh và thưởng thức cà phê giữa rừng thông.', 'TP.HCM', 'Xe Giường Nằm VIP', false)
ON CONFLICT (id) DO NOTHING;

SELECT setval('tours_id_seq', (SELECT MAX(id) FROM tours));

-- Seed Data: Sample Itineraries
INSERT INTO itineraries (tour_id, day_number, title, description, meals)
VALUES
(1, 1, 'Đón đoàn - Bán Đảo Sơn Trà - Biển Mỹ Khê', 'Xe và HDV đón quý khách tại sân bay Đà Nẵng. Khởi hành tham quan Chùa Linh Ứng Bãi Bụt, chiêm ngưỡng tượng Phật Bà Quan Âm cao 67m hướng ra biển. Buổi chiều tự do tắm biển Mỹ Khê.', 'Trưa, Tối'),
(1, 2, 'Khu Du Lịch Bà Nà Hills - Cầu Vàng', 'Ăn sáng tại khách sạn. Đoàn lên cáp treo Bà Nà đạt 4 kỷ lục thế giới. Check-in Cầu Vàng bàn tay khổng lồ, Làng Pháp cổ kính, vui chơi tại Fantasy Park.', 'Sáng, Trưa buffet, Tối'),
(1, 3, 'Ngũ Hành Sơn - Làng Đá Mỹ Nghệ - Phố Cổ Hội An', 'Khám phá Ngũ Hành Sơn non nước, tham quan động Huyền Không. Chiều vào phố cổ Hội An: Chùa Cầu, nhà cổ Tấn Ký, thả đèn hoa đăng trên dòng sông Hoài.', 'Sáng, Trưa, Tối'),
(1, 4, 'Chợ Hàn Đà Nẵng - Mua quà lưu niệm - Tiễn sân bay', 'Tự do mua sắm đặc sản Đà Nẵng tại Chợ Hàn (chả bò, hải sản khô). Xe đưa đoàn ra sân bay Đà Nẵng, kết thúc chuyến tham quan đầy ý nghĩa.', 'Sáng, Trưa'),

(2, 1, 'Đón sân bay Phú Quốc - Check-in Sunset Sanato - Grand World', 'Đáp chuyến bay tới Phú Quốc, xe đưa đoàn về nhận phòng khách sạn. Chiều ngắm hoàng hôn tuyệt đẹp tại Sunset Sanato. Tối tham quan Thành phố không ngủ Grand World và xem show Sắc Màu Venice.', 'Trưa, Tối'),
(2, 2, 'Tour Canô 4 Đảo - Cáp Treo Hòn Thơm vượt biển', 'Trải nghiệm canô cao tốc khám phá Hòn Mây Rút, Hòn Gầm Ghì lặn ngắm san hô tự nhiên. Trải nghiệm cáp treo 3 dây vượt biển dài nhất thế giới sang đảo Hòn Thơm.', 'Sáng, Trưa hải sản, Tối'),
(2, 3, 'Nhà Thùng Nước Mắm - Cơ Sở Ngọc Trai - Tiễn đoàn', 'Ghé thăm nhà thùng nước mắm truyền thống Phú Quốc hơn 100 năm tuổi, tìm hiểu kỹ thuật nuôi cấy ngọc trai cao cấp. Xe đưa quý khách ra sân bay.', 'Sáng, Trưa'),

(3, 1, 'Hà Nội - Vịnh Hạ Long - Hang Sửng Sốt - Đảo Ti Tốp', 'Xe đón khách tại Hà Nội khởi hành đi Hạ Long theo cao tốc. Lên du thuyền 5 sao thưởng thức đồ uống chào mừng. Chiều thăm hang Sửng Sốt lộng lẫy và leo núi ngắm toàn cảnh vịnh tại đảo Ti Tốp.', 'Trưa buffet, Tối tiệc nướng'),
(3, 2, 'Tập Thái Cực Quyền đón bình minh - Chèo Kayak Hang Luồn - Về Hà Nội', 'Dậy sớm đón bình minh trên boong tàu với lớp tập Thái Cực Quyền nhẹ nhàng. Trải nghiệm chèo kayak len lỏi qua hang Luồn. Trả phòng, thưởng thức bữa trưa sớm trước khi xe đưa về Hà Nội.', 'Sáng nhẹ, Trưa brunch')
ON CONFLICT DO NOTHING;

-- Seed Data: Sample Bookings for Demo
INSERT INTO bookings (booking_code, tour_id, customer_name, customer_email, customer_phone, departure_date, adults_count, children_count, total_price, notes, status)
VALUES
('BK8821901', 1, 'Nguyễn Văn An', 'an.nguyen@gmail.com', '0912345678', CURRENT_DATE + INTERVAL '7 days', 2, 1, 13203000, 'Yêu cầu phòng tầng cao hướng biển', 'CONFIRMED'),
('BK8821902', 2, 'Trần Thị Mai', 'mai.tran@yahoo.com', '0987654321', CURRENT_DATE + INTERVAL '14 days', 2, 0, 10980000, 'Gia đình đi tuần trăng mật, hỗ trợ trang trí phòng', 'CONFIRMED'),
('BK8821903', 3, 'Lê Hoàng Nam', 'namle@outlook.com', '0903112233', CURRENT_DATE + INTERVAL '5 days', 1, 0, 3250000, 'Đi một mình, cần hỗ trợ xe đón phố cổ', 'PENDING'),
('BK8821904', 5, 'Phạm Thu Trang', 'trangpham@gmail.com', '0978999888', CURRENT_DATE + INTERVAL '10 days', 4, 0, 11800000, 'Nhóm bạn phượt, đăng ký thêm chèo kayak', 'PENDING')
ON CONFLICT (booking_code) DO NOTHING;

