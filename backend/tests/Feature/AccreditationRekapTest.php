<?php

namespace Tests\Feature;

use App\Models\AlumniProfile;
use App\Models\TracerAnswer;
use App\Models\TracerQuestion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AccreditationRekapTest extends TestCase
{
    use RefreshDatabase;

    public function test_recap_includes_tracer_response_rate_and_top_campuses(): void
    {
        $admin = User::create([
            'name' => 'Admin',
            'phone_number' => '6281000000000',
            'password' => 'password',
            'role' => 'admin',
        ]);
        Sanctum::actingAs($admin);

        $question = TracerQuestion::create([
            'question_text' => 'Evaluasi sekolah',
            'question_type' => 'text',
            'is_required' => true,
            'order_number' => 1,
        ]);

        $alumni = [];
        foreach ([
            ['6281000000001', 'Kampus A'],
            ['6281000000002', 'Kampus A'],
            ['6281000000003', 'Kampus B'],
        ] as $index => [$phone, $campus]) {
            $user = User::create([
                'name' => "Alumni {$index}",
                'phone_number' => $phone,
                'nisn' => sprintf('%010d', $index + 1),
                'password' => 'password',
                'role' => 'alumni',
            ]);
            AlumniProfile::create([
                'user_id' => $user->id,
                'graduation_year' => 2024,
                'current_status' => 'mahasiswa',
                'campus_name' => $campus,
            ]);
            $alumni[] = $user;
        }

        $pendingAlumni = User::create([
            'name' => 'Alumni Menunggu',
            'phone_number' => '6281000000004',
            'nisn' => '0000000004',
            'password' => 'password',
            'role' => 'alumni',
            'alumni_approval_status' => 'pending',
        ]);
        AlumniProfile::create([
            'user_id' => $pendingAlumni->id,
            'graduation_year' => 2024,
            'current_status' => 'mahasiswa',
            'campus_name' => 'Kampus Menunggu',
        ]);

        foreach ([$alumni[0], $alumni[2]] as $respondent) {
            TracerAnswer::create([
                'user_id' => $respondent->id,
                'question_id' => $question->id,
                'answer_value' => 'Baik',
                'submitted_at' => now(),
            ]);
        }

        $this->getJson('/api/tracer-answers/recap')
            ->assertOk()
            ->assertJsonPath('response_rate.total_alumni', 3)
            ->assertJsonPath('response_rate.responded_alumni', 2)
            ->assertJsonPath('response_rate.percentage', 66.67)
            ->assertJsonPath('top_campuses.0.campus_name', 'Kampus A')
            ->assertJsonPath('top_campuses.0.total', 2);
    }
}
