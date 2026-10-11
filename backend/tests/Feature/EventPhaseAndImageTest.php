<?php

namespace Tests\Feature;

use App\Models\CareerPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class EventPhaseAndImageTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_publish_event_with_phase_and_photo(): void
    {
        Storage::fake('public');
        $admin = $this->createUser('Admin Event', 'admin');
        Sanctum::actingAs($admin);

        $response = $this->post('/api/career-posts', [
            'title' => 'Reuni Alumni',
            'category' => 'event_umum',
            'event_phase' => 'completed',
            'company_or_institution' => 'SMAN 1 Talang Padang',
            'description' => 'Dokumentasi reuni alumni.',
            'event_image' => $this->fakePng('reuni.png'),
        ]);

        $response->assertCreated()
            ->assertJsonPath('post.event_phase', 'completed');

        $post = CareerPost::firstOrFail();
        $this->assertNotNull($post->event_image_path);
        $this->assertNotNull($post->event_image_url);
        Storage::disk('public')->assertExists($post->event_image_path);
    }

    public function test_alumni_dashboard_query_only_returns_approved_upcoming_events(): void
    {
        $admin = $this->createUser('Admin Event', 'admin');
        $alumni = $this->createUser('Alumni', 'alumni');
        Sanctum::actingAs($alumni);

        $upcoming = $this->createEvent($admin, 'Agenda Mendatang', 'upcoming');
        $this->createEvent($admin, 'Agenda Selesai', 'completed');
        $this->createEvent($admin, 'Agenda Pending', 'upcoming', 'pending');

        $this->getJson('/api/career-posts?category=event_umum&event_phase=upcoming')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $upcoming->id);

        Sanctum::actingAs($admin);
        $this->putJson("/api/career-posts/{$upcoming->id}", ['event_phase' => 'completed'])
            ->assertOk()
            ->assertJsonPath('post.event_phase', 'completed');
    }

    public function test_alumni_cannot_upload_event_photos(): void
    {
        Storage::fake('public');
        Sanctum::actingAs($this->createUser('Alumni', 'alumni'));

        $this->post('/api/career-posts', [
            'title' => 'Event Alumni',
            'category' => 'event_umum',
            'company_or_institution' => 'Komunitas Alumni',
            'description' => 'Acara komunitas alumni.',
            'event_image' => $this->fakePng('acara.png'),
        ])->assertUnprocessable();

        $this->assertDatabaseCount('career_posts', 0);
        $this->assertSame([], Storage::disk('public')->allFiles());
    }

    private function createEvent(User $author, string $title, string $phase, string $status = 'approved'): CareerPost
    {
        return CareerPost::create([
            'author_id' => $author->id,
            'title' => $title,
            'category' => 'event_umum',
            'event_phase' => $phase,
            'company_or_institution' => 'SMAN 1 Talang Padang',
            'description' => 'Informasi agenda sekolah.',
            'status' => $status,
        ]);
    }

    private function createUser(string $name, string $role): User
    {
        return User::create([
            'name' => $name,
            'phone_number' => '628100000'.($role === 'admin' ? '01' : '02'),
            'nisn' => $role === 'alumni' ? '0012345678' : null,
            'password' => 'password123',
            'role' => $role,
        ]);
    }

    private function fakePng(string $name): UploadedFile
    {
        return UploadedFile::fake()->createWithContent(
            $name,
            base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/a4kAAAAASUVORK5CYII=')
        );
    }
}
