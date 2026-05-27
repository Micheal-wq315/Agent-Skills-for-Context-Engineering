import pdfplumber
import os
import sys

def extract_pdf_text(pdf_path, max_pages=None):
    """Extract text from a PDF file"""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            total_pages = len(pdf.pages)
            if max_pages is None:
                pages_to_extract = total_pages
            else:
                pages_to_extract = min(max_pages, total_pages)
            
            print(f"\n{'='*80}")
            print(f"文件: {os.path.basename(pdf_path)}")
            print(f"总页数: {total_pages}")
            print(f"将提取前 {pages_to_extract} 页")
            print(f"{'='*80}\n")
            
            all_text = []
            for i in range(pages_to_extract):
                page = pdf.pages[i]
                text = page.extract_text()
                if text:
                    all_text.append(f"\n--- 第 {i+1} 页 ---\n")
                    all_text.append(text)
                    
            return ''.join(all_text)
    except Exception as e:
        return f"读取错误: {str(e)}"

def main():
    base_path = r"c:\Users\18881\Desktop\Agent-Skills-for-Context-Engineering-main\skills\robomaster"
    output_dir = os.path.join(base_path, "extracted_content")
    os.makedirs(output_dir, exist_ok=True)
    
    pdf_files = {
        "规则手册": "pdf\\UTF-8RoboMaster 2026 机甲大师超级对抗赛比赛规则手册V1.2.0（20251230）.pdf",
        "制作规范": "pdf\\UTF-8RoboMaster 2026 机甲大师高校系列赛机器人制作规范手册V1.1.0（20251225）.pdf",
        "通信协议": "pdf\\UTF-8RoboMaster 2026 机甲大师高校系列赛通信协议 V1.2.0（20260209）.pdf",
        "裁判系统": "pdf\\UTF-8RoboMaster 裁判系统用户手册V1.5.pdf"
    }
    
    print("RoboMaster 2026 PDF文本提取工具")
    print("=" * 80)
    
    for name, relative_path in pdf_files.items():
        pdf_file = os.path.join(base_path, relative_path)
        output_file = os.path.join(output_dir, f"{name}.txt")
        
        if os.path.exists(pdf_file):
            print(f"\n正在提取: {name}...")
            text = extract_pdf_text(pdf_file, max_pages=None)
            
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(text)
            
            print(f"已保存到: {output_file}")
            print(f"提取文本长度: {len(text)} 字符")
        else:
            print(f"\n文件不存在: {pdf_file}\n")

if __name__ == "__main__":
    main()
