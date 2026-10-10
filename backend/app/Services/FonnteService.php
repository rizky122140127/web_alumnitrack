<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FonnteService
{
    protected string $apiUrl = 'https://api.fonnte.com/send';
    protected string $apiToken;

    public function __construct()
    {
        $this->apiToken = config('services.fonnte.token', '');
    }

    /**
     * Send a WhatsApp message via Fonnte API.
     *
     * @param string $phoneNumber  Recipient phone number (e.g. 6281234567890)
     * @param string $message      Message content
     * @return array{success: bool, response: mixed}
     */
    public function sendMessage(string $phoneNumber, string $message): array
    {
        if (empty($this->apiToken)) {
            Log::warning('Fonnte API token not configured. Skipping WA send.');
            return [
                'success'  => false,
                'response' => 'API token not configured.',
            ];
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => $this->apiToken,
            ])->post($this->apiUrl, [
                'target'  => $phoneNumber,
                'message' => $message,
            ]);

            $data = $response->json();

            $success = $response->successful() && ($data['status'] ?? false);

            if (!$success) {
                Log::error('Fonnte API error', [
                    'phone'    => $phoneNumber,
                    'response' => $data,
                ]);
            }

            return [
                'success'  => $success,
                'response' => $data,
            ];
        } catch (\Exception $e) {
            Log::error('Fonnte API exception', [
                'phone'   => $phoneNumber,
                'message' => $e->getMessage(),
            ]);

            return [
                'success'  => false,
                'response' => $e->getMessage(),
            ];
        }
    }
}
