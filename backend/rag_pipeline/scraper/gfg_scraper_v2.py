import requests
from bs4 import BeautifulSoup
from PIL import Image
from io import BytesIO
import base64
import json
import os
import time

TOPICS = {
    "binary-search":      "https://www.geeksforgeeks.org/binary-search/",
    "merge-sort":         "https://www.geeksforgeeks.org/merge-sort/",
    "linked-list":        "https://www.geeksforgeeks.org/linked-list-set-1-introduction/",
    "binary-tree":        "https://www.geeksforgeeks.org/introduction-to-binary-tree/",
    "two-pointers":       "https://www.geeksforgeeks.org/two-pointers-technique/",
    "sliding-window":     "https://www.geeksforgeeks.org/window-sliding-technique/",
    "quicksort":          "https://www.geeksforgeeks.org/quick-sort/",
    "bst":                "https://www.geeksforgeeks.org/binary-search-tree-set-1-search-and-insertion/",
}

HEADERS = {"User-Agent": "Mozilla/5.0"}

def scrape_topic(topic_name, url):
    """
    Scrapes a GFG page and extracts:
    - Structured text sections
    - Code examples with their surrounding context
    - Diagrams/images with their captions
    - Step-by-step algorithm descriptions
    """
    print(f"Scraping {topic_name} from {url}...")
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
    except Exception as e:
        print(f"Failed to fetch {url}: {e}")
        return None

    soup = BeautifulSoup(resp.text, "html.parser")

    result = {
        "topic": topic_name,
        "url": url,
        "sections": [],       
        "code_examples": [],  
        "diagrams": [],       
        "steps": [],          
    }

    current_section = {"heading": "Introduction", "content": ""}

    # Main content container in GFG
    content_div = soup.find("article") or soup.find("div", class_="entry-content")
    if not content_div:
        content_div = soup

    for tag in content_div.find_all(["h2", "h3", "p", "ul", "ol", "pre", "img"]):
        if tag.name in ["h2", "h3"]:
            if current_section["content"].strip():
                result["sections"].append(current_section.copy())
            current_section = {"heading": tag.get_text(strip=True), "content": ""}

        elif tag.name in ["p", "ul", "ol"]:
            text = tag.get_text(separator=" ").strip()
            if text:
                current_section["content"] += text + "\n\n"

        elif tag.name == "pre":
            code_text = tag.get_text()
            prev_text = ""
            prev = tag.find_previous_sibling(["p", "h3", "h2"])
            if prev:
                prev_text = prev.get_text(strip=True)

            result["code_examples"].append({
                "context": prev_text,
                "code": code_text,
                "section": current_section["heading"],
            })

        elif tag.name == "img":
            src = tag.get("src", "")
            if not src or "logo" in src or "ad" in src.lower() or not src.startswith("http"):
                continue

            caption = tag.get("alt", "")
            next_tag = tag.find_next_sibling(["p", "figcaption"])
            if next_tag:
                caption = next_tag.get_text(strip=True) or caption

            try:
                img_resp = requests.get(src, headers=HEADERS, timeout=5)
                if img_resp.status_code == 200:
                    img = Image.open(BytesIO(img_resp.content)).convert("RGB")
                    img.thumbnail((800, 600))
                    buf = BytesIO()
                    img.save(buf, format="JPEG", quality=85)
                    img_b64 = base64.b64encode(buf.getvalue()).decode()

                    result["diagrams"].append({
                        "caption": caption,
                        "section": current_section["heading"],
                        "base64": img_b64,
                        "src_url": src,
                    })
                    print(f"  Captured diagram: {caption[:30]}...")
            except Exception as e:
                print(f"  Failed to capture image {src}: {e}")

    if current_section["content"].strip():
        result["sections"].append(current_section)

    for ol in content_div.find_all("ol"):
        prev = ol.find_previous_sibling(["h2", "h3", "p"])
        heading = prev.get_text(strip=True) if prev else ""
        if any(word in heading.lower() for word in ["algorithm", "approach", "step", "procedure", "method"]):
            steps = [li.get_text(strip=True) for li in ol.find_all("li") if li.get_text(strip=True)]
            if steps:
                result["steps"].append({
                    "heading": heading,
                    "steps": steps
                })

    return result

def run_scraper():
    save_path = "f:/GEN_AI_ASSISTANT/backend/data/raw/structured"
    os.makedirs(save_path, exist_ok=True)
    
    for topic, url in TOPICS.items():
        data = scrape_topic(topic, url)
        if data:
            with open(f"{save_path}/{topic}.json", "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            print(f"Saved {topic} structured data.")
        time.sleep(2) # Polite scraping

if __name__ == "__main__":
    run_scraper()
