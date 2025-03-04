import pyautogui
import random
import time
import string
import sys

# Safety feature - move mouse to top-left corner to abort
pyautogui.FAILSAFE = True

def simulate_typing(num_keys=None):
    if num_keys is None:
        # Choose random number of keypresses (1-8)
        num_keys = random.randint(1, 8)
    
    # Safe keys to press (various types of keyboard input)
    alphanumeric = list(string.ascii_lowercase + string.digits)
    special_keys = ['space', 'tab', 'enter', 'backspace']
    arrow_keys = ['up', 'down', 'left', 'right']
    
    # Different key categories to choose from
    key_groups = [
        alphanumeric,  # Regular typing
        special_keys,  # Special keys
        arrow_keys     # Arrow keys
    ]
    
    for _ in range(num_keys):
        # Pick a key group and then a key from that group
        group = random.choice(key_groups)
        key = random.choice(group)
        
        # Press the key using pyautogui
        pyautogui.press(key)
        
        # Random delay between keypresses
        time.sleep(random.uniform(0.1, 0.7))
    
    # Occasionally use keyboard shortcuts (works on macOS)
    if random.random() < 0.3:
        shortcuts = [
            ['command', 'c'], 
            ['command', 'v'],
            ['command', 'z'],
            ['command', 'a'],
            ['command', 'f']
        ]
        shortcut = random.choice(shortcuts)
        pyautogui.hotkey(*shortcut)

def main():
    # Get screen size for mouse movements
    screen_width, screen_height = pyautogui.size()
    
    print("Activity simulation started.")
    print("To stop: Move mouse to top-left corner quickly OR press Ctrl+C in terminal")
    
    try:
        while True:
            # Random mouse movements
            x = random.randint(100, screen_width - 100)
            y = random.randint(100, screen_height - 100)
            
            # Move to random position with random duration
            pyautogui.moveTo(x, y, duration=random.uniform(0.5, 1.5))
            
            # Small movements left and right
            for _ in range(random.randint(1, 3)):
                offset_x = random.randint(-50, 50)
                offset_y = random.randint(-20, 20)
                pyautogui.moveRel(offset_x, offset_y, duration=0.3)
                time.sleep(0.2)
            
            # Random clicking
            if random.random() < 0.2:
                pyautogui.click()
            
            # Random action - focus on typing activity
            action_weights = random.choices(
                ['light_typing', 'heavy_typing', 'just_mouse'],
                weights=[0.5, 0.3, 0.2],
                k=1
            )[0]
            
            if action_weights == 'light_typing':
                simulate_typing(random.randint(2, 5))
            elif action_weights == 'heavy_typing':
                simulate_typing(random.randint(8, 15))
            
            # Wait approximately 3 seconds (with small random variation)
            time.sleep(random.uniform(2.5, 3.5))
            
    except KeyboardInterrupt:
        print("\nSimulation ended by user (Ctrl+C).")
    except Exception as e:
        print(f"\nSimulation ended: {e}")

if __name__ == "__main__":
    # Check if running on macOS
    if sys.platform == 'darwin':
        print("Running on macOS - using pyautogui for keyboard control")
        print("You may need to grant accessibility permissions in System Preferences")
    
    # Wait 5 seconds before starting to give you time to switch windows
    print("Starting in 5 seconds... Switch to your target window!")
    time.sleep(5)
    main()