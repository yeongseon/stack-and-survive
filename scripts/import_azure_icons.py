import hashlib
import io
from pathlib import Path
import urllib.request
import zipfile

URL = "https://arch-center.azureedge.net/icons/Azure_Public_Service_Icons_V24.zip"
ARCHIVE_SHA256 = "921594ccd1bf3d9c0a1bd7b6d924e050551a59342f2b353bb74bdcf761c35141"
FILES = {
    "Icons/app services/10035-icon-service-App-Services.svg": (
        "app-service.svg",
        "529d83fc80637a96b6d27f6cfac7536e1c5f9b1b67f58aef4e2e3d6f47fd4925",
    ),
    "Icons/databases/10130-icon-service-SQL-Database.svg": (
        "azure-sql.svg",
        "a26124a2b188ccf910520c935c726f7364e0f5935d7a4319ebcab9c80a40e475",
    ),
    "Icons/databases/03675-icon-service-Azure-Managed-Redis.svg": (
        "managed-redis.svg",
        "fa4b65d5946115084be1e842ecb934ab7f01b3019a450d19640ea3c3eaf9bab0",
    ),
    "Icons/networking/10076-icon-service-Application-Gateways.svg": (
        "application-gateway.svg",
        "531e668e47cf61872b2811ec67dcc103cee2ecc1d272f07132d6196d68ba6c19",
    ),
}


def main():
    root = Path(__file__).resolve().parents[1]
    target = root / "apps/web/public/assets/azure-icons"
    if not (target.parent / "ATTRIBUTION.md").is_file():
        raise RuntimeError(
            "Create and review the asset provenance record before import"
        )
    with urllib.request.urlopen(URL, timeout=60) as response:
        data = response.read()
    if hashlib.sha256(data).hexdigest() != ARCHIVE_SHA256:
        raise RuntimeError(
            "Upstream archive changed; review provenance before updating"
        )
    archive = zipfile.ZipFile(io.BytesIO(data))
    payloads = []
    for source, (filename, expected) in FILES.items():
        payload = archive.read(f"Azure_Public_Service_Icons/{source}")
        if hashlib.sha256(payload).hexdigest() != expected:
            raise RuntimeError(f"Checksum mismatch: {source}")
        payloads.append((filename, payload))
    payloads.append(
        (
            "Microsoft_Terms_of_Use.pdf",
            archive.read("Azure_Public_Service_Icons/Microsoft_Terms_of_Use.pdf"),
        )
    )
    target.mkdir(exist_ok=True)
    for filename, payload in payloads:
        destination = target / filename
        if destination.exists() and destination.read_bytes() != payload:
            raise RuntimeError(f"Refusing to overwrite changed asset: {destination}")
        destination.write_bytes(payload)
        print(f"{filename}: {hashlib.sha256(payload).hexdigest()}")


if __name__ == "__main__":
    main()
