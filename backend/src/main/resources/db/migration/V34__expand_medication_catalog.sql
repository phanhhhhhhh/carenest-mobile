-- CareNest: substantially widen medication_catalog coverage.
--
-- Attempted to auto-import from the official source (Thông tư 28/2024/TT-BYT
-- "Danh mục thuốc thiết yếu", the free government essential-medicines list)
-- but the published PDF (datafiles.chinhphu.vn/cpp/files/vbpq/2024/11/28-byt.pdf)
-- uses a non-standard Vietnamese font encoding with no ToUnicode map, and its
-- annex table relies on merged/spanning cells — both `pdftotext -layout` and
-- raw-stream extraction produced scrambled STT-to-name alignment and dropped
-- diacritics (e.g. "Ung" for "Uống"). Trusting that output would have risked
-- silently inserting wrong dosage forms/strengths against real drug names,
-- which is unacceptable for medical reference data. No OCR toolchain
-- (poppler/pdftoppm) is available in this environment either.
--
-- Instead, this migration hand-adds ~110 more well-established medications
-- (verified against standard pharmacology, not scraped) — extending into
-- antibiotics, neuro/psych, ophthalmology, and dermatology, all areas an
-- elderly-care household plausibly has a prescription for, while skipping
-- hospital-only IV anaesthesia/chemo/contrast-media drugs that don't apply
-- to a home medication list. Same accuracy bar as the V33 seed set.

INSERT INTO medication_catalog (name, brand_names, dosage_form, common_strengths, category, atc_code, usage_note) VALUES
-- Huyết áp (more)
('Captopril', 'Capoten', 'Viên nén', '25mg, 50mg', 'HUYET_AP', 'C09AA01', 'Uống lúc đói, 1 giờ trước bữa ăn'),
('Carvedilol', 'Dilatrend', 'Viên nén', '6.25mg, 12.5mg, 25mg', 'HUYET_AP', 'C07AG02', 'Uống cùng bữa ăn để giảm chóng mặt'),
('Atenolol', 'Tenormin', 'Viên nén', '50mg, 100mg', 'HUYET_AP', 'C07AB03', 'Uống 1 lần/ngày vào cùng giờ mỗi ngày'),
('Doxazosin', 'Cardura', 'Viên nén', '1mg, 2mg, 4mg', 'HUYET_AP', 'C02CA04', 'Uống vào buổi tối, dễ gây hạ huyết áp tư thế'),
('Clonidine', 'Catapres', 'Viên nén', '0.1mg, 0.2mg', 'HUYET_AP', 'C02AC01', 'Không tự ý ngừng thuốc đột ngột'),
('Methyldopa', 'Aldomet', 'Viên nén', '250mg', 'HUYET_AP', 'C02AB01', 'Uống cùng bữa ăn'),

-- Tiểu đường (more)
('Insulin aspart', 'NovoRapid', 'Dung dịch tiêm', '100 IU/mL', 'TIEU_DUONG', 'A10AB05', 'Tiêm dưới da ngay trước bữa ăn'),
('Insulin detemir', 'Levemir', 'Dung dịch tiêm', '100 IU/mL', 'TIEU_DUONG', 'A10AE05', 'Tiêm dưới da 1-2 lần/ngày vào cùng giờ'),
('Dapagliflozin', 'Forxiga', 'Viên nén', '5mg, 10mg', 'TIEU_DUONG', 'A10BK01', 'Uống 1 lần/ngày vào buổi sáng, uống đủ nước'),
('Pioglitazone', 'Actos', 'Viên nén', '15mg, 30mg', 'TIEU_DUONG', 'A10BG03', 'Uống 1 lần/ngày, không phụ thuộc bữa ăn'),
('Repaglinide', 'NovoNorm', 'Viên nén', '0.5mg, 1mg, 2mg', 'TIEU_DUONG', 'A10BX02', 'Uống trước mỗi bữa ăn chính 15-30 phút'),
('Linagliptin', 'Trajenta', 'Viên nén', '5mg', 'TIEU_DUONG', 'A10BH05', 'Uống 1 lần/ngày, không phụ thuộc bữa ăn'),

-- Mỡ máu (more)
('Ezetimibe', 'Ezetrol', 'Viên nén', '10mg', 'MO_MAU', 'C10AX09', 'Uống 1 lần/ngày, không phụ thuộc bữa ăn'),
('Gemfibrozil', 'Lopid', 'Viên nang', '300mg, 600mg', 'MO_MAU', 'C10AB04', 'Uống 30 phút trước bữa ăn sáng và tối'),
('Pravastatin', 'Pravachol', 'Viên nén', '10mg, 20mg, 40mg', 'MO_MAU', 'C10AA03', 'Uống vào buổi tối'),

-- Tim mạch (more)
('Amiodarone', 'Cordarone', 'Viên nén', '200mg', 'TIM_MACH', 'C01BD01', 'Theo dõi chức năng tuyến giáp/gan định kỳ khi dùng dài ngày'),
('Nicorandil', 'Ikorel', 'Viên nén', '5mg, 10mg', 'TIM_MACH', 'C01DX16', 'Uống 2 lần/ngày, có thể gây đau đầu lúc đầu'),
('Trimetazidine', 'Vastarel MR', 'Viên nén phóng thích chậm', '35mg', 'TIM_MACH', 'C01EB15', 'Uống cùng bữa ăn sáng và tối'),
('Dabigatran', 'Pradaxa', 'Viên nang', '110mg, 150mg', 'TIM_MACH', 'B01AE07', 'Uống cùng nhiều nước, không mở viên nang'),
('Apixaban', 'Eliquis', 'Viên nén', '2.5mg, 5mg', 'TIM_MACH', 'B01AF02', 'Uống đều đặn 2 lần/ngày, không tự ý ngừng'),
('Enoxaparin', 'Lovenox', 'Dung dịch tiêm', '40mg/0.4mL, 60mg/0.6mL', 'TIM_MACH', 'B01AB05', 'Tiêm dưới da vùng bụng, theo dõi dấu hiệu chảy máu'),
('Torsemide', 'Demadex', 'Viên nén', '5mg, 10mg', 'TIM_MACH', 'C03CA04', 'Uống vào buổi sáng để tránh tiểu đêm'),
('Nitroglycerin', 'Nitromint', 'Viên ngậm dưới lưỡi', '0.5mg', 'TIM_MACH', 'C01DA02', 'Ngậm dưới lưỡi khi có cơn đau thắt ngực, không nuốt'),
('Ivabradine', 'Procoralan', 'Viên nén', '5mg, 7.5mg', 'TIM_MACH', 'C01EB17', 'Uống cùng bữa ăn, 2 lần/ngày'),

-- Xương khớp (more)
('Risedronate', 'Actonel', 'Viên nén', '35mg (uống 1 lần/tuần)', 'XUONG_KHOP', 'M05BA07', 'Uống lúc bụng đói với nhiều nước, ngồi/đứng thẳng 30 phút sau uống'),
('Zoledronic acid', 'Aclasta', 'Dung dịch truyền tĩnh mạch', '5mg/100mL (truyền 1 lần/năm)', 'XUONG_KHOP', 'M05BA08', 'Truyền tại cơ sở y tế, uống đủ nước trước truyền'),
('Etoricoxib', 'Arcoxia', 'Viên nén', '60mg, 90mg', 'XUONG_KHOP', 'M01AH05', 'Uống sau ăn, thận trọng ở người bệnh tim mạch'),
('Colchicine', 'Colchicin', 'Viên nén', '1mg', 'XUONG_KHOP', 'M04AC01', 'Dùng cho cơn gout cấp, không dùng kéo dài liều cao'),
('Piroxicam', 'Feldene', 'Viên nang', '20mg', 'XUONG_KHOP', 'M01AC01', 'Uống sau ăn, thận trọng với người có bệnh dạ dày'),
('Chondroitin sulfate', 'Chondroitin 400', 'Viên nang', '400mg', 'XUONG_KHOP', 'M01AX25', 'Uống cùng bữa ăn, dùng liên tục nhiều tuần'),
('Diclofenac gel', 'Voltaren Emulgel', 'Gel bôi ngoài da', '1%', 'XUONG_KHOP', 'M02AA15', 'Bôi tại chỗ khớp đau, không bôi lên da tổn thương'),

-- Tiêu hóa (more)
('Pantoprazole', 'Pantoloc', 'Viên nén', '20mg, 40mg', 'TIEU_HOA', 'A02BC02', 'Uống trước bữa ăn sáng, nuốt nguyên viên'),
('Rabeprazole', 'Pariet', 'Viên nén', '10mg, 20mg', 'TIEU_HOA', 'A02BC04', 'Uống trước bữa ăn sáng'),
('Sucralfate', 'Ulcar', 'Viên nén / gói bột', '1g', 'TIEU_HOA', 'A02BX02', 'Uống lúc bụng đói, 1 giờ trước bữa ăn'),
('Simethicone', 'Air-X, Espumisan', 'Viên nang', '80mg', 'TIEU_HOA', 'A03AX13', 'Uống sau bữa ăn và trước khi ngủ khi đầy hơi'),
('Loperamide', 'Imodium', 'Viên nang', '2mg', 'TIEU_HOA', 'A07DA03', 'Chỉ dùng khi tiêu chảy cấp, không dùng quá 2 ngày mà không rõ nguyên nhân'),
('Oresol', 'ORS', 'Gói bột pha uống', '1 gói/200mL nước', 'TIEU_HOA', 'A07CA', 'Pha đúng tỷ lệ, uống từng ngụm nhỏ khi tiêu chảy/mất nước'),
('Bisacodyl', 'Dulcolax', 'Viên bao tan trong ruột', '5mg', 'TIEU_HOA', 'A06AB02', 'Uống vào buổi tối, không nhai viên, tác dụng sau 6-12 giờ'),
('Men vi sinh (probiotic)', 'Antibio, Enterogermina', 'Gói bột / ống uống', '—', 'TIEU_HOA', 'A07FA', 'Uống cách xa thời điểm dùng kháng sinh ít nhất 2 giờ'),

-- Hô hấp (more)
('Montelukast', 'Singulair', 'Viên nén', '10mg', 'HO_HAP', 'R03DC03', 'Uống 1 lần/ngày vào buổi tối'),
('Ipratropium bromide', 'Atrovent', 'Ống hít định liều', '20mcg/liều', 'HO_HAP', 'R03BB01', 'Dùng khi khó thở, tránh xịt vào mắt'),
('Fluticasone', 'Flixotide', 'Ống hít định liều', '125mcg/liều', 'HO_HAP', 'R03BA05', 'Súc miệng sau khi hít để tránh nấm miệng'),
('Acetylcystein (gói)', 'Acemuc', 'Gói bột / viên sủi', '200mg', 'HO_HAP', 'R05CB01', 'Pha với nước, uống sau bữa ăn'),
('Bromhexine', 'Bisolvon', 'Viên nén', '8mg', 'HO_HAP', 'R05CB02', 'Uống cùng nhiều nước để long đờm hiệu quả'),
('Dextromethorphan', 'Atussin', 'Siro / viên nang', '15mg/5mL', 'HO_HAP', 'R05DA09', 'Dùng cho ho khan, không dùng khi ho có đờm nhiều'),

-- Thần kinh / tâm thần (mới — sa sút trí tuệ, trầm cảm, mất ngủ, Parkinson,
-- động kinh: rất phổ biến ở người cao tuổi)
('Donepezil', 'Aricept', 'Viên nén', '5mg, 10mg', 'THAN_KINH', 'N06DA02', 'Uống 1 lần/ngày vào buổi tối trước khi ngủ'),
('Memantine', 'Ebixa', 'Viên nén', '10mg, 20mg', 'THAN_KINH', 'N06DX01', 'Uống 1 lần/ngày, không phụ thuộc bữa ăn'),
('Rivastigmine', 'Exelon', 'Miếng dán ngoài da', '4.6mg/24h, 9.5mg/24h', 'THAN_KINH', 'N06DA03', 'Dán 1 miếng/ngày, đổi vị trí dán mỗi lần'),
('Sertraline', 'Zoloft', 'Viên nén', '50mg, 100mg', 'THAN_KINH', 'N06AB06', 'Uống 1 lần/ngày, không tự ý ngừng đột ngột'),
('Escitalopram', 'Lexapro', 'Viên nén', '10mg, 20mg', 'THAN_KINH', 'N06AB10', 'Uống 1 lần/ngày vào cùng giờ mỗi ngày'),
('Mirtazapine', 'Remeron', 'Viên nén', '15mg, 30mg', 'THAN_KINH', 'N06AX11', 'Uống vào buổi tối, có thể gây buồn ngủ'),
('Amitriptyline', 'Elavil', 'Viên nén', '25mg', 'THAN_KINH', 'N06AA09', 'Uống vào buổi tối, thận trọng ở người có bệnh tim'),
('Quetiapine', 'Seroquel', 'Viên nén', '25mg, 100mg, 200mg', 'THAN_KINH', 'N05AH04', 'Uống vào buổi tối, tăng liều từ từ theo chỉ định'),
('Diazepam', 'Valium', 'Viên nén', '5mg', 'THAN_KINH', 'N05BA01', 'Dùng ngắn ngày, tránh phối hợp rượu bia'),
('Zolpidem', 'Stilnox', 'Viên nén', '10mg', 'THAN_KINH', 'N05CF02', 'Uống ngay trước khi ngủ, đảm bảo ngủ đủ 7-8 giờ sau'),
('Levodopa + Carbidopa', 'Sinemet', 'Viên nén', '250mg/25mg', 'THAN_KINH', 'N04BA02', 'Uống trước bữa ăn 30-60 phút để hấp thu tốt hơn'),
('Pramipexole', 'Mirapex', 'Viên nén', '0.25mg, 1mg', 'THAN_KINH', 'N04BC05', 'Tăng liều từ từ theo chỉ định, có thể gây buồn ngủ đột ngột'),
('Gabapentin', 'Neurontin', 'Viên nang', '300mg', 'THAN_KINH', 'N03AX12', 'Uống đều đặn, không tự ý ngừng đột ngột'),
('Pregabalin', 'Lyrica', 'Viên nang', '75mg, 150mg', 'THAN_KINH', 'N03AX16', 'Uống 2 lần/ngày, thận trọng khi lái xe/vận hành máy'),
('Valproic acid', 'Depakine', 'Viên bao', '200mg, 500mg', 'THAN_KINH', 'N03AG01', 'Uống cùng bữa ăn, theo dõi chức năng gan'),
('Piracetam', 'Nootropil', 'Viên nén', '800mg, 1200mg', 'THAN_KINH', 'N06BX03', 'Uống cùng bữa ăn'),
('Cinnarizine', 'Stugeron', 'Viên nén', '25mg', 'THAN_KINH', 'N07CA02', 'Uống sau bữa ăn, dùng khi chóng mặt/rối loạn tiền đình'),
('Vinpocetine', 'Cavinton', 'Viên nén', '5mg', 'THAN_KINH', 'N06BX18', 'Uống sau bữa ăn'),
('Ginkgo biloba', 'Tanakan', 'Viên nén', '40mg', 'THAN_KINH', 'N06DX02', 'Uống cùng bữa ăn, 2-3 lần/ngày'),

-- Kháng sinh / kháng khuẩn (mới)
('Amoxicillin', 'Amoxicillin STADA', 'Viên nang', '500mg', 'KHANG_SINH', 'J01CA04', 'Uống đủ liều theo chỉ định dù đã đỡ triệu chứng'),
('Amoxicillin + Acid clavulanic', 'Augmentin', 'Viên nén', '625mg, 1g', 'KHANG_SINH', 'J01CR02', 'Uống cùng bữa ăn để giảm rối loạn tiêu hóa'),
('Azithromycin', 'Zithromax', 'Viên nén', '250mg, 500mg', 'KHANG_SINH', 'J01FA10', 'Uống lúc đói, thường dùng đợt ngắn 3-5 ngày'),
('Cephalexin', 'Cefalexin STADA', 'Viên nang', '500mg', 'KHANG_SINH', 'J01DB01', 'Uống đủ liều theo chỉ định'),
('Cefixime', 'Cefixim STADA', 'Viên nang', '200mg', 'KHANG_SINH', 'J01DD08', 'Uống 1-2 lần/ngày theo chỉ định'),
('Cefuroxime', 'Zinnat', 'Viên nén', '250mg, 500mg', 'KHANG_SINH', 'J01DC02', 'Uống cùng bữa ăn để tăng hấp thu'),
('Ciprofloxacin', 'Ciprobay', 'Viên nén', '500mg', 'KHANG_SINH', 'J01MA02', 'Không uống cùng sữa/thuốc bổ sung canxi'),
('Levofloxacin', 'Levoflox', 'Viên nén', '500mg', 'KHANG_SINH', 'J01MA12', 'Uống đều đặn, tránh nắng gắt khi đang dùng'),
('Doxycycline', 'Doxycyclin STADA', 'Viên nang', '100mg', 'KHANG_SINH', 'J01AA02', 'Uống với nhiều nước, ngồi thẳng sau khi uống 30 phút'),
('Clindamycin', 'Dalacin C', 'Viên nang', '300mg', 'KHANG_SINH', 'J01FF01', 'Uống với nhiều nước'),
('Metronidazole', 'Flagyl', 'Viên nén', '250mg', 'KHANG_SINH', 'J01XD01', 'Không uống rượu bia trong và sau khi dùng thuốc'),
('Co-trimoxazole', 'Bactrim', 'Viên nén', '480mg, 960mg', 'KHANG_SINH', 'J01EE01', 'Uống cùng nhiều nước'),
('Clarithromycin', 'Klacid', 'Viên nén', '250mg, 500mg', 'KHANG_SINH', 'J01FA09', 'Uống cùng bữa ăn để giảm kích ứng dạ dày'),
('Fluconazole', 'Diflucan', 'Viên nang', '150mg', 'KHANG_SINH', 'J02AC01', 'Thuốc kháng nấm, uống theo đúng đợt điều trị'),
('Acyclovir (uống)', 'Zovirax', 'Viên nén', '400mg, 800mg', 'KHANG_SINH', 'J05AB01', 'Uống với nhiều nước, dùng sớm khi có triệu chứng zona/herpes'),
('Oseltamivir', 'Tamiflu', 'Viên nang', '75mg', 'KHANG_SINH', 'J05AH02', 'Dùng sớm trong 48 giờ đầu khi có triệu chứng cúm'),
('Nitrofurantoin', 'Nitrofurantoin STADA', 'Viên nang', '50mg, 100mg', 'KHANG_SINH', 'J01XE01', 'Uống cùng bữa ăn, thường dùng cho nhiễm khuẩn tiết niệu'),

-- Mắt (mới — glaucoma, khô mắt, sau mổ đục thủy tinh thể: phổ biến ở người già)
('Timolol (nhỏ mắt)', 'Timoptic', 'Dung dịch nhỏ mắt', '0.5%', 'MAT', 'S01ED01', 'Nhỏ 1 giọt/lần theo chỉ định, ấn nhẹ góc mắt sau khi nhỏ'),
('Latanoprost', 'Xalatan', 'Dung dịch nhỏ mắt', '0.005%', 'MAT', 'S01EE01', 'Nhỏ 1 giọt vào buổi tối, bảo quản lạnh trước khi mở nắp'),
('Nước mắt nhân tạo', 'Refresh Tears', 'Dung dịch nhỏ mắt', '—', 'MAT', 'S01XA20', 'Nhỏ khi khô mắt, có thể dùng nhiều lần trong ngày'),
('Tobramycin (nhỏ mắt)', 'Tobrex', 'Dung dịch nhỏ mắt', '0.3%', 'MAT', 'S01AA12', 'Nhỏ theo chỉ định, không dùng kéo dài quá đợt điều trị'),
('Brimonidine', 'Alphagan', 'Dung dịch nhỏ mắt', '0.2%', 'MAT', 'S01EA05', 'Nhỏ 2 lần/ngày theo chỉ định điều trị glaucoma'),

-- Da liễu (mới)
('Hydrocortisone (bôi)', 'Hydrocortisone cream', 'Kem bôi ngoài da', '1%', 'DA_LIEU', 'D07AA02', 'Bôi lớp mỏng vùng da viêm, không bôi diện rộng kéo dài'),
('Betamethasone (bôi)', 'Diprosone', 'Kem bôi ngoài da', '0.05%', 'DA_LIEU', 'D07AC01', 'Bôi lớp mỏng theo chỉ định, tránh vùng mặt kéo dài'),
('Fusidic acid', 'Fucidin', 'Kem bôi ngoài da', '2%', 'DA_LIEU', 'D06AX01', 'Bôi vùng da nhiễm khuẩn 2-3 lần/ngày'),
('Silver sulfadiazine', 'Silvadene', 'Kem bôi ngoài da', '1%', 'DA_LIEU', 'D06BA01', 'Dùng cho vết bỏng/vết thương hở theo chỉ định'),
('Clotrimazole (bôi)', 'Canesten', 'Kem bôi ngoài da', '1%', 'DA_LIEU', 'D01AC01', 'Bôi vùng da nấm 2 lần/ngày, dùng đủ đợt kể cả khi đỡ'),

-- Khác (more — tiết niệu, tuyến giáp, kháng viêm toàn thân, vitamin/khoáng chất)
('Solifenacin', 'Vesicare', 'Viên nén', '5mg, 10mg', 'KHAC', 'G04BD08', 'Uống 1 lần/ngày, dùng cho tiểu không tự chủ/tiểu gấp'),
('Oxybutynin', 'Ditropan', 'Viên nén', '5mg', 'KHAC', 'G04BD04', 'Uống 2-3 lần/ngày theo chỉ định'),
('Methimazole', 'Thyrozol', 'Viên nén', '5mg, 10mg', 'KHAC', 'H03BB02', 'Uống theo đúng liều, theo dõi công thức máu định kỳ'),
('Propylthiouracil', 'PTU', 'Viên nén', '50mg', 'KHAC', 'H03BA02', 'Uống chia nhiều lần/ngày theo chỉ định'),
('Prednisolone', 'Prednisolon', 'Viên nén', '5mg', 'KHAC', 'H02AB06', 'Uống vào buổi sáng cùng bữa ăn, không tự ý ngừng đột ngột'),
('Methylprednisolone', 'Medrol', 'Viên nén', '4mg, 16mg', 'KHAC', 'H02AB04', 'Uống vào buổi sáng cùng bữa ăn'),
('Sắt (II) sulfat', 'Tardyferon', 'Viên nén', '80mg sắt nguyên tố', 'KHAC', 'B03AA07', 'Uống lúc đói để hấp thu tốt hơn, có thể gây phân đen'),
('Acid folic', 'Folacin', 'Viên nén', '5mg', 'KHAC', 'B03BB01', 'Uống sau bữa ăn'),
('Vitamin B12', 'Cyanocobalamin', 'Viên nén / ống tiêm', '1000mcg', 'KHAC', 'B03BA01', 'Uống hoặc tiêm bắp theo chỉ định'),
('Multivitamin người cao tuổi', 'Centrum Silver', 'Viên nén', '—', 'KHAC', 'A11AA', 'Uống 1 viên/ngày sau bữa ăn'),
('Vitamin D3', 'Aquadetrim', 'Dung dịch uống / viên nén', '400IU, 1000IU', 'KHAC', 'A11CC05', 'Uống cùng bữa ăn có chất béo để tăng hấp thu'),
('Magnesi B6', 'Magne B6', 'Viên nén', '470mg/5mg', 'KHAC', 'A12CC', 'Uống cùng bữa ăn, chia 2-3 lần/ngày');
