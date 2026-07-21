<?php
namespace App\Services;
class BarcodeService {
    public function generateBarcode(string $code): string { return $code; }
    public function generateQrCode(string $data): string { return $data; }
}