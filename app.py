import tkinter as tk
from tkinter import filedialog, messagebox
from PIL import Image, ImageTk, ImageOps # Added ImageOps for potential padding/bordering if needed
import qrcode
from pyzbar.pyzbar import decode as decode_qr_code_from_image # Renamed for clarity

# Global variables to store PIL Image and PhotoImage objects to prevent garbage collection
generated_qr_pil_image = None
generated_qr_tk_image = None
uploaded_qr_pil_image = None
uploaded_qr_tk_image = None

# --- Core QR Functions ---

def generate_qr_image(data_to_encode):
    """Generates a QR code PIL image from the given data."""
    if not data_to_encode.strip():
        messagebox.showwarning("Input Error", "Please enter data to generate QR code.")
        return None
    try:
        qr = qrcode.QRCode(
            version=1, # Keep it simple, auto-adjusts if data is too large
            error_correction=qrcode.constants.ERROR_CORRECT_L, # Low error correction
            box_size=10, # Size of each box in the QR code
            border=4,    # Thickness of the border
        )
        qr.add_data(data_to_encode)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        return img
    except Exception as e:
        messagebox.showerror("Generation Error", f"Failed to generate QR code: {e}")
        return None

def decode_qr_from_file(image_path):
    """Decodes a QR code from an image file path."""
    try:
        img = Image.open(image_path)
        decoded_objects = decode_qr_code_from_image(img)
        if decoded_objects:
            # Assuming one QR code per image for simplicity
            return decoded_objects[0].data.decode("utf-8")
        else:
            return None
    except Exception as e:
        messagebox.showerror("Decoding Error", f"Failed to read or decode QR code from image: {e}")
        return None

# --- GUI Event Handlers ---

def handle_generate_qr_button_click():
    global generated_qr_pil_image, generated_qr_tk_image # Allow modification of global variables
    data = entry_data_for_qr.get()
    img_pil = generate_qr_image(data)

    if img_pil:
        generated_qr_pil_image = img_pil # Store the original PIL image for saving
        
        # Create a display version (e.g., resized)
        display_img = img_pil.resize((200, 200), Image.Resampling.LANCZOS)
        generated_qr_tk_image = ImageTk.PhotoImage(display_img)
        
        qr_display_label.config(image=generated_qr_tk_image, text="") # Display image, clear text
        qr_display_label.image = generated_qr_tk_image # Keep a reference!
        
        download_qr_button.config(state=tk.NORMAL) # Enable download button
        messagebox.showinfo("Success", "QR Code generated successfully!")

def handle_download_qr_button_click():
    global generated_qr_pil_image
    if generated_qr_pil_image:
        file_path_to_save = filedialog.asksaveasfilename(
            defaultextension=".png",
            filetypes=[("PNG files", "*.png"), ("JPEG files", "*.jpg"), ("All files", "*.*")]
        )
        if file_path_to_save:
            try:
                generated_qr_pil_image.save(file_path_to_save)
                messagebox.showinfo("Success", f"QR Code saved to {file_path_to_save}")
            except Exception as e:
                messagebox.showerror("Save Error", f"Failed to save QR Code: {e}")
    else:
        messagebox.showwarning("No QR Code", "Please generate a QR code first.")

def handle_upload_and_decode_button_click():
    global uploaded_qr_pil_image, uploaded_qr_tk_image, decoded_text_var
    file_path_to_open = filedialog.askopenfilename(
        title="Select QR Code Image",
        filetypes=[("Image files", "*.png *.jpg *.jpeg *.bmp *.gif"), ("All files", "*.*")]
    )
    if file_path_to_open:
        # Display the uploaded image (optional but good for UX)
        try:
            uploaded_qr_pil_image = Image.open(file_path_to_open)
            display_img = uploaded_qr_pil_image.resize((200, 200), Image.Resampling.LANCZOS)
            uploaded_qr_tk_image = ImageTk.PhotoImage(display_img)
            
            uploaded_image_display_label.config(image=uploaded_qr_tk_image, text="")
            uploaded_image_display_label.image = uploaded_qr_tk_image # Keep reference
        except Exception as e:
            messagebox.showwarning("Image Display Error", f"Could not display uploaded image: {e}")
            uploaded_image_display_label.config(image=None, text="Error displaying image") # Clear
            uploaded_image_display_label.image = None

        # Decode the QR code
        decoded_data = decode_qr_from_file(file_path_to_open)
        if decoded_data:
            decoded_text_var.set(decoded_data)
            messagebox.showinfo("Success", "QR Code decoded successfully!")
        else:
            decoded_text_var.set("No QR code found or could not decode.")
            # messagebox.showwarning might be too intrusive if no QR is found, label update is enough.

# --- GUI Setup ---
root = tk.Tk()
root.title("QR Code Utility")

# Main frame for padding
main_app_frame = tk.Frame(root, padx=15, pady=15)
main_app_frame.pack(expand=True, fill=tk.BOTH)

# --- Generation Section ---
generation_frame = tk.LabelFrame(main_app_frame, text="Generate QR Code", padx=10, pady=10)
generation_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=10, pady=5)

tk.Label(generation_frame, text="Enter data:").pack(anchor=tk.W, pady=(0,5))
entry_data_for_qr = tk.Entry(generation_frame, width=45)
entry_data_for_qr.pack(fill=tk.X, pady=(0,10))

generate_qr_button = tk.Button(generation_frame, text="Generate QR Code", command=handle_generate_qr_button_click)
generate_qr_button.pack(pady=(0,10))

qr_display_label = tk.Label(generation_frame, text="Generated QR will appear here", relief=tk.SUNKEN, width=28, height=12, background="white")
qr_display_label.pack(pady=(0,10), ipadx=5, ipady=5) # ipadx/y give some size to the sunken border

download_qr_button = tk.Button(generation_frame, text="Download QR Code", command=handle_download_qr_button_click, state=tk.DISABLED)
download_qr_button.pack()

# --- Decoding Section ---
decoding_frame = tk.LabelFrame(main_app_frame, text="Decode QR Code", padx=10, pady=10)
decoding_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=10, pady=5)

upload_qr_button = tk.Button(decoding_frame, text="Upload QR Image to Decode", command=handle_upload_and_decode_button_click)
upload_qr_button.pack(pady=(0,10))

uploaded_image_display_label = tk.Label(decoding_frame, text="Uploaded image will appear here", relief=tk.SUNKEN, width=28, height=12, background="white")
uploaded_image_display_label.pack(pady=(0,10), ipadx=5, ipady=5)

tk.Label(decoding_frame, text="Decoded data:").pack(anchor=tk.W, pady=(5,5))
decoded_text_var = tk.StringVar()
decoded_text_var.set("...") # Initial placeholder text
decoded_result_display_label = tk.Label(
    decoding_frame, 
    textvariable=decoded_text_var, 
    wraplength=300, # Adjust as needed for your typical data length
    relief=tk.GROOVE, 
    height=5, # Approx lines of text
    anchor=tk.NW, # Align text to top-left
    justify=tk.LEFT,
    padx=5, pady=5
)
decoded_result_display_label.pack(fill=tk.X, expand=False, pady=(0,10))


if __name__ == "__main__":
    # Set a minimum size for the window
    root.minsize(650, 450) # Adjust as you see fit
    root.mainloop()