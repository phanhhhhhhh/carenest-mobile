-- CareNest: curated reference catalog of common medications, scoped to the
-- conditions most relevant to elderly care (hypertension, diabetes, lipids,
-- cardiovascular, bone/joint, GI, respiratory, pain, other/general). Used to
-- power name autocomplete when a family member adds a medication — not a
-- full replica of Vietnam's national drug registry (~10k+ SKUs), which is
-- both unnecessary for this app's scope and requires ongoing maintenance
-- this project can't sustain. Read-only reference data, not tied to any user.

CREATE TABLE medication_catalog (
    id               BIGSERIAL    PRIMARY KEY,
    name             VARCHAR(150) NOT NULL,
    brand_names      VARCHAR(300),
    dosage_form      VARCHAR(50)  NOT NULL,
    common_strengths VARCHAR(150),
    category         VARCHAR(30)  NOT NULL,
    atc_code         VARCHAR(10),
    usage_note       VARCHAR(300),
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_medication_catalog_name ON medication_catalog (LOWER(name));
CREATE INDEX idx_medication_catalog_category ON medication_catalog (category);

INSERT INTO medication_catalog (name, brand_names, dosage_form, common_strengths, category, atc_code, usage_note) VALUES
-- Huyết áp (hypertension)
('Amlodipine', 'Amlor, Amlodipin STADA', 'Viên nén', '5mg, 10mg', 'HUYET_AP', 'C08CA01', 'Uống vào buổi sáng, có thể uống cùng hoặc không cùng bữa ăn'),
('Losartan', 'Cozaar, Losartan STADA', 'Viên nén', '25mg, 50mg, 100mg', 'HUYET_AP', 'C09CA01', 'Uống 1 lần/ngày, không phụ thuộc bữa ăn'),
('Valsartan', 'Diovan', 'Viên nén', '80mg, 160mg', 'HUYET_AP', 'C09CA03', 'Uống 1 lần/ngày, không phụ thuộc bữa ăn'),
('Enalapril', 'Renitec', 'Viên nén', '5mg, 10mg, 20mg', 'HUYET_AP', 'C09AA02', 'Có thể gây ho khan, theo dõi kali máu'),
('Lisinopril', 'Zestril', 'Viên nén', '5mg, 10mg, 20mg', 'HUYET_AP', 'C09AA03', 'Uống 1 lần/ngày vào cùng giờ mỗi ngày'),
('Bisoprolol', 'Concor', 'Viên nén', '2.5mg, 5mg, 10mg', 'HUYET_AP', 'C07AB07', 'Không tự ý ngừng thuốc đột ngột'),
('Metoprolol', 'Betaloc', 'Viên nén', '25mg, 50mg, 100mg', 'HUYET_AP', 'C07AB02', 'Uống cùng bữa ăn để giảm kích ứng dạ dày'),
('Hydrochlorothiazide', 'Hydrochlorothiazid STADA', 'Viên nén', '12.5mg, 25mg', 'HUYET_AP', 'C03AA03', 'Uống vào buổi sáng để tránh tiểu đêm'),
('Indapamide', 'Natrilix SR', 'Viên nén phóng thích chậm', '1.5mg', 'HUYET_AP', 'C03BA11', 'Uống 1 lần/ngày vào buổi sáng'),
('Telmisartan', 'Micardis', 'Viên nén', '40mg, 80mg', 'HUYET_AP', 'C09CA07', 'Uống 1 lần/ngày, không phụ thuộc bữa ăn'),
('Perindopril', 'Coversyl', 'Viên nén', '5mg, 10mg', 'HUYET_AP', 'C09AA04', 'Uống 1 lần vào buổi sáng trước ăn'),
('Nifedipine', 'Adalat LA', 'Viên nén phóng thích chậm', '30mg, 60mg', 'HUYET_AP', 'C08CA05', 'Nuốt nguyên viên, không nghiền/nhai'),

-- Tiểu đường (diabetes)
('Metformin', 'Glucophage, Diaformin, Metformin STADA', 'Viên nén', '500mg, 850mg, 1000mg', 'TIEU_DUONG', 'A10BA02', 'Uống trong hoặc ngay sau bữa ăn để giảm rối loạn tiêu hóa'),
('Gliclazide', 'Diamicron MR', 'Viên nén phóng thích chậm', '30mg, 60mg', 'TIEU_DUONG', 'A10BB09', 'Uống trước bữa sáng, theo dõi dấu hiệu hạ đường huyết'),
('Glimepiride', 'Amaryl', 'Viên nén', '1mg, 2mg, 4mg', 'TIEU_DUONG', 'A10BB12', 'Uống ngay trước hoặc trong bữa ăn đầu tiên trong ngày'),
('Sitagliptin', 'Januvia', 'Viên nén', '50mg, 100mg', 'TIEU_DUONG', 'A10BH01', 'Uống 1 lần/ngày, không phụ thuộc bữa ăn'),
('Insulin glargine', 'Lantus', 'Dung dịch tiêm', '100 IU/mL', 'TIEU_DUONG', 'A10AE04', 'Tiêm dưới da 1 lần/ngày vào cùng giờ mỗi ngày'),
('Insulin mixtard', 'Mixtard 30', 'Dung dịch tiêm', '100 IU/mL', 'TIEU_DUONG', 'A10AD01', 'Tiêm trước bữa ăn 30 phút'),
('Empagliflozin', 'Jardiance', 'Viên nén', '10mg, 25mg', 'TIEU_DUONG', 'A10BK03', 'Uống 1 lần/ngày vào buổi sáng, uống đủ nước'),
('Acarbose', 'Glucobay', 'Viên nén', '50mg, 100mg', 'TIEU_DUONG', 'A10BF01', 'Nhai cùng miếng đầu tiên của bữa ăn'),

-- Mỡ máu (lipid/cholesterol)
('Atorvastatin', 'Lipitor, Atorvastatin STADA', 'Viên nén', '10mg, 20mg, 40mg', 'MO_MAU', 'C10AA05', 'Có thể uống vào bất kỳ giờ nào trong ngày, uống đều đặn'),
('Rosuvastatin', 'Crestor', 'Viên nén', '5mg, 10mg, 20mg', 'MO_MAU', 'C10AA07', 'Uống 1 lần/ngày, thường vào buổi tối'),
('Simvastatin', 'Zocor', 'Viên nén', '10mg, 20mg, 40mg', 'MO_MAU', 'C10AA01', 'Uống vào buổi tối để tăng hiệu quả'),
('Fenofibrate', 'Lipanthyl', 'Viên nang', '145mg, 200mg', 'MO_MAU', 'C10AB05', 'Uống cùng bữa ăn để tăng hấp thu'),

-- Tim mạch / kháng đông - kháng kết tập tiểu cầu (cardiovascular / anticoagulant)
('Aspirin', 'Aspirin pH8, Aspirin 81', 'Viên nén bao tan trong ruột', '81mg, 100mg', 'TIM_MACH', 'B01AC06', 'Uống sau ăn để giảm kích ứng dạ dày'),
('Clopidogrel', 'Plavix', 'Viên nén', '75mg', 'TIM_MACH', 'B01AC04', 'Uống 1 lần/ngày, không tự ý ngừng thuốc'),
('Warfarin', 'Coumadin', 'Viên nén', '1mg, 2mg, 5mg', 'TIM_MACH', 'B01AA03', 'Cần xét nghiệm INR định kỳ, tránh thay đổi chế độ ăn đột ngột'),
('Rivaroxaban', 'Xarelto', 'Viên nén', '10mg, 15mg, 20mg', 'TIM_MACH', 'B01AF01', 'Uống cùng bữa ăn để tăng hấp thu (liều 15-20mg)'),
('Digoxin', 'Digoxin STADA', 'Viên nén', '0.25mg', 'TIM_MACH', 'C01AA05', 'Theo dõi nhịp tim trước khi uống, khoảng điều trị hẹp'),
('Furosemide', 'Lasix', 'Viên nén', '40mg', 'TIM_MACH', 'C03CA01', 'Uống vào buổi sáng để tránh tiểu đêm'),
('Spironolactone', 'Aldactone', 'Viên nén', '25mg, 50mg', 'TIM_MACH', 'C03DA01', 'Theo dõi kali máu định kỳ'),
('Isosorbide mononitrate', 'Imdur', 'Viên nén phóng thích chậm', '30mg, 60mg', 'TIM_MACH', 'C01DA14', 'Uống vào buổi sáng, không nghiền viên phóng thích chậm'),

-- Xương khớp (bone/joint)
('Alendronate', 'Fosamax', 'Viên nén', '70mg (uống 1 lần/tuần)', 'XUONG_KHOP', 'M05BA04', 'Uống lúc bụng đói với nhiều nước, ngồi/đứng thẳng 30 phút sau uống'),
('Calcium + Vitamin D3', 'Calcium Corbiere, Ostelin', 'Viên nén / viên sủi', '500mg + 200IU', 'XUONG_KHOP', 'A12AX', 'Uống sau bữa ăn để tăng hấp thu'),
('Glucosamine', 'Glucosamine 1500', 'Viên nén / gói bột', '1500mg', 'XUONG_KHOP', 'M01AX05', 'Uống cùng bữa ăn, dùng liên tục nhiều tuần mới thấy hiệu quả'),
('Meloxicam', 'Mobic', 'Viên nén', '7.5mg, 15mg', 'XUONG_KHOP', 'M01AC06', 'Uống sau ăn, thận trọng ở người có bệnh dạ dày/thận'),
('Diacerein', 'Artrodar', 'Viên nang', '50mg', 'XUONG_KHOP', 'M01AX21', 'Uống cùng bữa ăn, có thể gây phân lỏng'),

-- Tiêu hóa (GI)
('Omeprazole', 'Losec, Omeprazol STADA', 'Viên nang', '20mg, 40mg', 'TIEU_HOA', 'A02BC01', 'Uống trước bữa ăn sáng 30-60 phút'),
('Esomeprazole', 'Nexium', 'Viên nén', '20mg, 40mg', 'TIEU_HOA', 'A02BC05', 'Uống trước bữa ăn, nuốt nguyên viên'),
('Domperidone', 'Motilium', 'Viên nén', '10mg', 'TIEU_HOA', 'A03FA03', 'Uống trước bữa ăn 15-30 phút'),
('Lactulose', 'Duphalac', 'Dung dịch uống', '10g/15mL', 'TIEU_HOA', 'A06AD11', 'Có thể uống cùng nước hoặc nước trái cây'),

-- Hô hấp (respiratory)
('Salbutamol', 'Ventolin', 'Ống hít định liều', '100mcg/liều', 'HO_HAP', 'R03AC02', 'Dùng khi lên cơn khó thở, súc miệng sau khi hít'),
('Tiotropium', 'Spiriva', 'Ống hít bột khô', '18mcg/liều', 'HO_HAP', 'R03BB04', 'Dùng 1 lần/ngày vào cùng giờ mỗi ngày'),
('Budesonide + Formoterol', 'Symbicort', 'Ống hít định liều', '160/4.5mcg', 'HO_HAP', 'R03AK07', 'Súc miệng sau khi hít để tránh nấm miệng'),
('Theophylline', 'Theostat', 'Viên nén phóng thích chậm', '100mg, 300mg', 'HO_HAP', 'R03DA04', 'Uống đều đặn, tránh dùng cùng caffeine liều cao'),

-- Giảm đau / hạ sốt (pain / analgesic)
('Paracetamol', 'Panadol, Efferalgan', 'Viên nén / viên sủi', '500mg, 650mg', 'GIAM_DAU', 'N02BE01', 'Không vượt quá 3g/ngày, thận trọng ở người bệnh gan'),
('Tramadol', 'Tramadol STADA', 'Viên nang', '50mg', 'GIAM_DAU', 'N02AX02', 'Có thể gây buồn ngủ, thận trọng khi vận động'),
('Diclofenac', 'Voltaren', 'Viên nén / gel bôi', '50mg, 75mg', 'GIAM_DAU', 'M01AB05', 'Uống sau ăn, thận trọng với người có bệnh tim mạch/dạ dày'),
('Celecoxib', 'Celebrex', 'Viên nang', '100mg, 200mg', 'GIAM_DAU', 'M01AH01', 'Uống cùng bữa ăn'),

-- Khác (other / general)
('Levothyroxine', 'Levothyrox, Berlthyrox', 'Viên nén', '50mcg, 100mcg', 'KHAC', 'H03AA01', 'Uống lúc bụng đói vào buổi sáng, cách xa canxi/sắt ít nhất 4 giờ'),
('Allopurinol', 'Zyloric', 'Viên nén', '100mg, 300mg', 'KHAC', 'M04AA01', 'Uống sau ăn, uống nhiều nước'),
('Finasteride', 'Proscar', 'Viên nén', '5mg', 'KHAC', 'G04CB01', 'Uống 1 lần/ngày, không phụ thuộc bữa ăn'),
('Tamsulosin', 'Harnal OCAS', 'Viên nén phóng thích chậm', '0.4mg', 'KHAC', 'G04CA02', 'Uống sau cùng một bữa ăn mỗi ngày'),
('Vitamin B complex', 'Neurobion, 3B', 'Viên nén', 'B1 100mg / B6 200mg / B12 200mcg', 'KHAC', 'A11EA', 'Uống sau bữa ăn'),
('Betahistine', 'Betaserc', 'Viên nén', '16mg, 24mg', 'KHAC', 'N07CA01', 'Uống cùng bữa ăn để giảm kích ứng dạ dày');
