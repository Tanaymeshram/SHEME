import logging
import sys

# Define logging format
LOG_FORMAT = "%(asctime)s - %(levelname)s - %(name)s - %(message)s"

def setup_logger(name: str = "SHEMS") -> logging.Logger:
    logger = logging.getLogger(name)
    
    # Avoid duplicate handlers if logger is already set up
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        
        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.INFO)
        
        # Formatter
        formatter = logging.Formatter(LOG_FORMAT)
        console_handler.setFormatter(formatter)
        
        logger.addHandler(console_handler)
        
    return logger

logger = setup_logger()
