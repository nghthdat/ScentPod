import os
import re

footer_html = """<footer class="site-footer">
    <div class="container">
      <div class="footer-content">
        
        <!-- Cột 1: Thương hiệu -->
        <div class="footer-brand">
          <div class="footer-logo">
            <img src="images/scentpod-logo-gold.png" alt="ScentPod Logo" class="brand-logo-img" width="40" height="40">
            <span class="brand-name">Scent<span class="accent">Pod</span></span>
          </div>
          <p class="footer-description">
            Thương hiệu nến thơm và sáp thơm thủ công, mang những mùi hương nhỏ bé đến gần hơn với những khoảnh khắc bình yên mỗi ngày.
          </p>
        </div>

        <!-- Cột 2: Khám phá -->
        <div>
          <h4 class="footer-heading">Khám phá</h4>
          <ul class="footer-links">
            <li><a href="index.html">Trang chủ</a></li>
            <li><a href="san-pham.html">Sản phẩm</a></li>
            <li><a href="ve-chung-toi.html">Về chúng tôi</a></li>
            <li><a href="dang-nhap.html">Tài khoản</a></li>
          </ul>
        </div>

        <!-- Cột 3: Liên hệ -->
        <div>
          <h4 class="footer-heading">Liên hệ</h4>
          <ul class="footer-contact">
            <li>
              <a href="mailto:scentpodcontact@gmail.com" class="footer-contact-link">Email</a>
              <br>
              <a href="mailto:scentpodcontact@gmail.com" style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.3rem; display: inline-block;">scentpodcontact@gmail.com</a>
            </li>
          </ul>
        </div>

        <!-- Cột 4: Kết nối với ScentPod -->
        <div>
          <h4 class="footer-heading">Kết nối với ScentPod</h4>
          <div class="footer-social">
            <a href="#" data-social="facebook" class="footer-social-link" title="Facebook ScentPod" aria-label="Facebook ScentPod">
              <svg class="footer-social-icon" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.03 2 11c0 2.87 1.48 5.43 3.8 7.04V22l3.81-2.09c.77.21 1.58.33 2.39.33 5.52 0 10-4.03 10-9s-4.48-9-10-9zm1.06 12.16l-2.58-2.75-5.04 2.75 5.54-5.89 2.64 2.75 4.98-2.75-5.54 5.89z"/>
              </svg>
            </a>
            <a href="#" data-social="instagram" class="footer-social-link" title="Instagram ScentPod" aria-label="Instagram ScentPod">
              <svg class="footer-social-icon" viewBox="0 0 24 24">
                <path d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10S2 17.514 2 12 6.486 2 12 2zm0 2c-4.411 0-8 3.589-8 8s3.589 8 8 8 8-3.589 8-8-3.589-8-8-8zm0 4c2.206 0 4 1.794 4 4s-1.794 4-4 4-4-1.794-4-4 1.794-4 4-4zm0 2c-1.103 0-2 .897-2 2s.897 2 2 2 2-.897 2-2-.897-2-2-2zm4.5-4c.828 0 1.5.672 1.5 1.5S17.328 9.5 16.5 9.5 15 8.828 15 8 15.672 6.5 16.5 6.5z"/>
              </svg>
            </a>
            <a href="#" data-social="threads" class="footer-social-link" title="Threads ScentPod" aria-label="Threads ScentPod">
              <svg class="footer-social-icon" viewBox="0 0 24 24">
                <path d="M14.6 11.2c-.4-.4-1-.7-1.8-.7s-1.4.3-1.8.7c-.4.4-.7 1-.7 1.8 0 .8.2 1.4.7 1.8.4.4 1 .7 1.8.7.8 0 1.4-.3 1.8-.7.4-.4.7-1 .7-1.8 0-.8-.3-1.4-.7-1.8zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.8 15.4c-1 .8-2.3 1.2-3.8 1.2-1.5 0-2.8-.5-3.8-1.4-1-1-1.6-2.3-1.6-3.8 0-1.5.5-2.8 1.4-3.8 1-1 2.3-1.6 3.8-1.6 1.1 0 2 .3 2.8.9.8.6 1.4 1.4 1.7 2.3h-1.8c-.3-.4-.6-.8-1-1-.5-.3-1.1-.4-1.7-.4-1 0-1.8.3-2.5 1-.7.7-1 1.5-1 2.5s.3 1.8 1 2.5c.7.7 1.5 1 2.5 1 .6 0 1.2-.2 1.7-.5.5-.3.9-.7 1.2-1.3h1.8c-.4 1-1 1.8-1.8 2.4z"/>
              </svg>
            </a>
            <a href="mailto:scentpodcontact@gmail.com" class="footer-social-link" title="Email ScentPod" aria-label="Email ScentPod">
              <svg class="footer-social-icon" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
      
      <div class="footer-bottom">
        <p>© 2026 ScentPod. Made with love by sinh viên.</p>
      </div>
    </div>
  </footer>"""

def update_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if filepath.endswith('thanh-toan.html'):
        if '<footer class="site-footer">' not in content:
            content = content.replace('<script src="js/main.js"></script>', footer_html + '\n\n  <script src="js/main.js"></script>')
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Injected into {filepath}")
        return

    pattern = re.compile(r'<footer class="site-footer">.*?</footer>', re.DOTALL)
    if pattern.search(content):
        content = pattern.sub(footer_html, content)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")
    else:
        print(f"Footer not found in {filepath}")

for f in ['index.html', 'san-pham.html', 've-chung-toi.html', 'dang-nhap.html', 'thanh-toan.html']:
    update_file(f)
