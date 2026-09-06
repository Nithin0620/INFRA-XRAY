from playwright.sync_api import sync_playwright

def run_cuj(page):
    # Navigate to the upload page directly
    page.goto("http://localhost:5173/upload")
    page.wait_for_timeout(1000)

    # Click the Next button
    page.get_by_placeholder("e.g., Highway Widening NH-48").fill("Test Project")
    page.wait_for_timeout(500)

    page.get_by_role("button", name="Next: Upload Files").click()
    page.wait_for_timeout(1000)

    # Move focus to the file input (it is visually hidden, but focus-within on label makes it visible)
    page.evaluate("document.querySelector('input[type=\"file\"]').focus()")
    page.wait_for_timeout(1000)

    # Take screenshot at the key moment showing the focus ring
    page.screenshot(path="/home/jules/verification/screenshots/verification.png")
    page.wait_for_timeout(1000)  # Hold final state for the video

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()  # MUST close context to save the video
            browser.close()
