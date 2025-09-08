02/09/2025
XÂY DỰNG WEBSITE QUẢN LÍ HOẠT ĐỘNG & CHẤM ĐRL
    Khởi tạo
        Các Frame works & Thư viện
            Về FE (Front-End)

                Vite: Khởi tạo dự án
                Vue: Frame Works chính, UI UX
                Naive UI: các components sẵn (tương tự bootstraps, flowbite, ...)
                Animate.css: các animation sẵn có
                CKeditor: trình editor văn bản

            Về BE (Back-End)

                Nodejs: Ngôn ngữ chính (javascript) - khỏi tải
                Express: Frame Works đi kèm
                mongoose: Cơ sở dữ liệu
                nodemon: tự động reload server
                cors: cấp quyền API
                Câu lệnh khởi tạo

            Về FE (Front-End): npm create vite@latest

                npm create vite@latest

            Về BE (Front-End): npm init -y

                npm init -y

            Phân tích cơ sở dữ liệu

                Bảng (SQL) - Schema (noSQL) 
                1. User 
                2. Author 
                3. Admin 
                4. Event(Tên, Id, Số lượng, Nơi tổ chức, Điểm, ..) 
                5. Category -> nhiều options 
                6. Options: có tên hoạt động, điểm, trạng thái 
                7. ActivityTable -> Nhiều Category 
                8. Diểm danh: (EventId, UserId) 
                9. Event-User(listUser, EventId)

                VÍ DỤ: Activity(Category-Đánh giá thái độ học tập, Category-Đánh giá ý thức chấp hành nội quy, Category-Đạt thành tích cao)

                Category-Đánh giá thái độ học tập Category-Đánh giá ý thức chấp hành nội quy Category-Đạt thành tích cao

                Options(đạt loại giỏi, 8, 1) Options(dọn vs, 10, 0)

                Khi tổng hợp điểm -> userId -> ActivityTable -> Category -> Options -> tính tổng điểm. => 8đ

                Schema User
                    Quyền hạn: 1. Xem: toàn bộ nội dung được đăng tải, sự kiện, .... 2. Sửa: Chỉ chỉnh sửa được dữ liệu của riêng cá nhân User. 3. Xoá: Chỉ chỉnh sửa được dữ liệu của riêng cá nhân User.

                Schema Author
                    Quyền hạn: 1. Xem: toàn bộ nội dung được đăng tải, sự kiện, .... 2. Sửa: Chỉ sửa được dữ liệu của riêng cá nhân User, Bài đăng, sự kiện. 3. Xoá: Chỉ sửa được dữ liệu của riêng cá nhân User, Bài đăng, sự kiện.

                Schema Admin
                    toàn quyền
                    Chức năng
                    Đăng bài đăng bài bằng những cái trình editor onl