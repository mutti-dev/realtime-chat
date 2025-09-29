
from django.conf import settings
import boto3
from botocore.config import Config
from uuid import uuid4

def upload_to_r2(file_obj, prefix="uploads/"):
    """
    Upload a Django UploadedFile-like object to Cloudflare R2 using boto3.
    Returns the public URL (string) on success, or None if upload fails.
    """

    try:
        # Get R2 settings from Django settings
        bucket = getattr(settings, "CLOUDFLARE_R2_BUCKET", None)
        endpoint = getattr(settings, "CLOUDFLARE_R2_BUCKET_ENDPOINT", None)
        access_key = getattr(settings, "CLOUDFLARE_R2_ACCESS_KEY", None)
        secret_key = getattr(settings, "CLOUDFLARE_R2_SECRET_KEY", None)
        base_url = getattr(settings, "AWS_S3_BASE_URL", None)  # e.g., https://<endpoint>/<bucket>

        if not all([bucket, endpoint, access_key, secret_key]):
            print("R2 settings missing, skipping upload.")
            return None

        # Initialize boto3 S3 client with SigV4 (Cloudflare R2 requires SigV4)
        client_config = Config(signature_version="s3v4")
        client = boto3.client(
            "s3",
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            endpoint_url=endpoint,
            config=client_config,
        )

        # Generate a unique key for the file
        key = f"{prefix}{uuid4().hex}_{file_obj.name}"

        # Read file content
        if hasattr(file_obj, "open"):
            file_obj.open()
        body = file_obj.read()

        # Determine content type
        content_type = getattr(file_obj, "content_type", None) or getattr(file_obj, "mimetype", None) or "application/octet-stream"

        # Upload to R2
        client.put_object(
            Bucket=bucket,
            Key=key,
            Body=body,
            ContentType=content_type
        )

        # Construct URL
        if base_url:
            return f"{base_url.rstrip('/')}/{key}"
        else:
            # fallback if AWS_S3_BASE_URL not set
            return f"{endpoint.rstrip('/')}/{bucket}/{key}"

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