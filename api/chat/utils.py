
from django.conf import settings
import boto3
from botocore.config import Config
from uuid import uuid4
from urllib.parse import urlparse


def upload_to_r2(file_obj, prefix="uploads/"):
    """
    Uploads file to R2 and returns the object key (not URL).
    """
    try:
        bucket = settings.CLOUDFLARE_R2_BUCKET
        endpoint = settings.CLOUDFLARE_R2_BUCKET_ENDPOINT
        access_key = settings.CLOUDFLARE_R2_ACCESS_KEY
        secret_key = settings.CLOUDFLARE_R2_SECRET_KEY

        client_config = Config(signature_version="s3v4")
        client = boto3.client(
            "s3",
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            endpoint_url=endpoint,
            config=client_config,
        )

        key = f"{prefix}{uuid4().hex}_{file_obj.name}"

        if hasattr(file_obj, "open"):
            file_obj.open()
        body = file_obj.read()

        content_type = getattr(file_obj, "content_type", None) or "application/octet-stream"

        client.put_object(Bucket=bucket, Key=key, Body=body, ContentType=content_type)

        return key  # ✅ only key returned

    except Exception as e:
        print("R2 upload failed:", e)
        return None






def generate_r2_presigned_url(file_key: str, expires_in: int = 3600) -> str:
    """
    Generate a temporary pre-signed URL for a file stored in Cloudflare R2.

    Args:
        file_key: The object key in R2 (e.g., 'messages/files/abc.jpg').
        expires_in: Expiration time in seconds (default 1 hour).

    Returns:
        A pre-signed URL string or None if generation fails.
    """
    try:
        bucket = getattr(settings, "CLOUDFLARE_R2_BUCKET", None)
        endpoint = getattr(settings, "CLOUDFLARE_R2_BUCKET_ENDPOINT", None)
        access_key = getattr(settings, "CLOUDFLARE_R2_ACCESS_KEY", None)
        secret_key = getattr(settings, "CLOUDFLARE_R2_SECRET_KEY", None)

        if not all([bucket, endpoint, access_key, secret_key]):
            print("R2 settings missing")
            return None

        # Initialize S3 client with SigV4 for presigned URL generation
        client_config = Config(signature_version="s3v4")
        s3 = boto3.client(
            "s3",
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            endpoint_url=endpoint,
            config=client_config,
        )

        # Generate pre-signed URL
        url = s3.generate_presigned_url(
             ClientMethod="get_object",
             Params={"Bucket": bucket, "Key": file_key},
             ExpiresIn=expires_in,
         )
        return url

    except Exception as e:
        print("Failed to generate pre-signed URL:", e)
        return None
    


# If you prefer upload_to_r2 to still return a full URL (for some cases), 
# then in your code before generating presigned URL, strip it back down to the key:
def extract_r2_key(url: str, bucket: str) -> str:
    """
    Extract object key from a full R2 URL.
    """
    path = urlparse(url).path  # e.g. "/mybucket/uploads/uuid_file.png"
    if path.startswith(f"/{bucket}/"):
        return path[len(bucket)+2:]  # strip "/bucket/"
    return path.lstrip("/")