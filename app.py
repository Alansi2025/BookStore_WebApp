import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from PIL import Image, ImageTk, UnidentifiedImageError
import qrcode
from pyzbar.pyzbar import decode as decode_qr
import os # For ensuring the save directory exists, if needed.

class QRCodeApp:
    def __init__(self, root_window):
        self.root = root_window
        self.root.title("QR Code Genie")
        # self.root.geometry("650x550") # Optional: set initial size

        # Style
        style = ttk.Style()
        style.theme_use('clam') # You can try 'alt', 'default', 'classic', 'vista', 'xpnative'

        self.notebook = ttk.Notebook(self.root)

        # --- Generate Tab ---
        self.generate_tab = ttk.Frame(self.notebook, padding="10")
        self.notebook.add(self.generate_tab, text='Generate QR Code')
        self.setup_generate_tab()

        # --- Decode Tab ---
        self.decode_tab = ttk.Frame(self.notebook, padding="10")
        self.notebook.add(self.decode_tab, text='Decode QR Code')
        self.setup_decode_tab()

        self.notebook.pack(expand=True, fill='both', padx=10, pady=10)

        self.generated_qr_pil_image = None # To store PIL Image for display/save
        self.qr_tk_image = None # For displaying generated QR
        self.uploaded_image_tk = None # For displaying uploaded QR

    def setup_generate_tab(self):
        # Input data
        input_frame = ttk.LabelFrame(self.generate_tab, text="Input", padding="10")
        input_frame.pack(fill="x", expand=False, pady=5)

        ttk.Label(input_frame, text="Enter data to encode:").pack(side="left", padx=5)
        self.data_entry = ttk.Entry(input_frame, width=50)
        self.data_entry.pack(side="left", expand=True, fill="x", padx=5)

        # Generate button
        self.generate_button = ttk.Button(self.generate_tab, text="✨ Generate QR Code", command=self.generate_qr)
        self.generate_button.pack(pady=10, fill="x", expand=False)

        # QR Code display
        qr_display_frame = ttk.LabelFrame(self.generate_tab, text="Generated QR Code", padding="10")
        qr_display_frame.pack(fill="both", expand=True, pady=5)
        
        self.qr_image_label = ttk.Label(qr_display_frame, text="QR Code will appear here")
        self.qr_image_label.pack(pady=10, anchor="center")

        # Download button
        self.download_button = ttk.Button(self.generate_tab, text="💾 Download QR Code (PNG)", command=self.download_qr, state=tk.DISABLED)
        self.download_button.pack(pady=10, fill="x", expand=False)

    def setup_decode_tab(self):
        # Upload button
        self.upload_button = ttk.Button(self.decode_tab, text="📂 Upload QR Code Image", command=self.upload_and_decode_qr)
        self.upload_button.pack(pady=10, fill="x", expand=False)

        # Image display
        uploaded_display_frame = ttk.LabelFrame(self.decode_tab, text="Uploaded Image Preview", padding="10")
        uploaded_display_frame.pack(fill="both", expand=True, pady=5)

        self.uploaded_image_label = ttk.Label(uploaded_display_frame, text="Uploaded image preview will appear here")
        self.uploaded_image_label.pack(pady=5, anchor="center")
        
        # Decoded data display
        decoded_data_frame = ttk.LabelFrame(self.decode_tab, text="Decoded Information", padding="10")
        decoded_data_frame.pack(fill="x", expand=False, pady=5)

        self.decoded_text_label = ttk.Label(decoded_data_frame, text="Decoded data:")
        self.decoded_text_label.pack(anchor="w", pady=(0,5))
        
        self.decoded_text_area = tk.Text(decoded_data_frame, height=6, width=60, wrap=tk.WORD, relief=tk.SOLID, borderwidth=1)
        self.decoded_text_area.pack(fill="x", expand=True)
        self.decoded_text_area.config(state=tk.DISABLED) # Start as disabled

    def _display_image_in_label(self, pil_image, label_widget, max_size=(250, 250)):
        display_img = pil_image.copy()
        display_img.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Store the PhotoImage as an attribute of the label or the class
        # to prevent it from being garbage collected.
        img_tk = ImageTk.PhotoImage(display_img)
        label_widget.config(image=img_tk, text="")
        label_widget.image = img_tk # Keep a reference!
        return img_tk


    def generate_qr(self):
        data = self.data_entry.get()
        if not data:
            messagebox.showwarning("Input Error", "Oops! Please enter some data to generate a QR code.")
            return

        try:
            qr = qrcode.QRCode(
                version=None, # Auto-detect version
                error_correction=qrcode.constants.ERROR_CORRECT_M, # Medium error correction
                box_size=10,
                border=4,
            )
            qr.add_data(data)
            qr.make(fit=True)

            self.generated_qr_pil_image = qr.make_image(fill_color="black", back_color="white").convert('RGB')
            
            self.qr_tk_image = self._display_image_in_label(self.generated_qr_pil_image, self.qr_image_label, (300,300))
            
            self.download_button.config(state=tk.NORMAL)
            messagebox.showinfo("Success!", "QR Code generated successfully! You can now download it.")

        except Exception as e:
            messagebox.showerror("Error", f"Oh no! Failed to generate QR Code: {e}")
            self.download_button.config(state=tk.DISABLED)
            self.qr_image_label.config(image=None, text="QR Code generation failed.")
            self.qr_image_label.image = None


    def download_qr(self):
        if not self.generated_qr_pil_image:
            messagebox.showerror("Error", "Hmm, there's no QR Code generated to download yet.")
            return

        file_path = filedialog.asksaveasfilename(
            defaultextension=".png",
            filetypes=[("PNG files", "*.png"), ("All files", "*.*")],
            title="Save QR Code As",
            initialfile="qrcode.png" # Default filename
        )
        if file_path:
            try:
                # Ensure directory exists (optional, filedialog usually handles this)
                # os.makedirs(os.path.dirname(file_path), exist_ok=True)
                self.generated_qr_pil_image.save(file_path)
                messagebox.showinfo("Success!", f"QR Code saved to:\n{file_path}")
            except Exception as e:
                messagebox.showerror("Error", f"Rats! Failed to save QR Code: {e}")

    def upload_and_decode_qr(self):
        file_path = filedialog.askopenfilename(
            title="Select QR Code Image",
            filetypes=[("Image files", "*.png *.jpg *.jpeg *.bmp *.gif"), ("All files", "*.*")]
        )
        if not file_path:
            return # User cancelled

        try:
            img = Image.open(file_path)
            
            # Display uploaded image
            self.uploaded_image_tk = self._display_image_in_label(img, self.uploaded_image_label, (250,250))

            # Decode
            decoded_objects = decode_qr(img)

            self.decoded_text_area.config(state=tk.NORMAL)
            self.decoded_text_area.delete(1.0, tk.END)
            if decoded_objects:
                all_decoded_data = []
                for i, obj in enumerate(decoded_objects):
                    decoded_data = obj.data.decode('utf-8', errors='replace') # Handle potential decoding errors
                    all_decoded_data.append(f"QR Code #{i+1} (Type: {obj.type}):\n{decoded_data}\n---")
                self.decoded_text_area.insert(tk.END, "\n".join(all_decoded_data).strip("\n---"))
                messagebox.showinfo("Success!", "QR Code(s) decoded successfully!")
            else:
                self.decoded_text_area.insert(tk.END, "No QR Code found in the image, or it could not be decoded.")
                messagebox.showwarning("Not Found", "Couldn't find a QR Code in the selected image, or it's unreadable.")
            self.decoded_text_area.config(state=tk.DISABLED)

        except UnidentifiedImageError:
            messagebox.showerror("Error", f"Cannot identify image file. Is it a valid image?\nFile: {file_path}")
            self._clear_decode_outputs()
        except FileNotFoundError:
            messagebox.showerror("Error", f"Oops, file not found: {file_path}")
            self._clear_decode_outputs()
        except Exception as e:
            messagebox.showerror("Error", f"An error occurred while processing the image: {e}")
            self._clear_decode_outputs(error_message=str(e))

    def _clear_decode_outputs(self, error_message=None):
        self.uploaded_image_label.config(image=None, text="Uploaded image preview will appear here")
        self.uploaded_image_label.image = None
        self.decoded_text_area.config(state=tk.NORMAL)
        self.decoded_text_area.delete(1.0, tk.END)
        if error_message:
            self.decoded_text_area.insert(tk.END, f"Error: {error_message}")
        self.decoded_text_area.config(state=tk.DISABLED)


if __name__ == "__main__":
    main_window = tk.Tk()
    app = QRCodeApp(main_window)
    main_window.mainloop()

