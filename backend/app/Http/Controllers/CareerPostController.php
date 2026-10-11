<?php

namespace App\Http\Controllers;

use App\Models\CareerPost;
use App\Services\TargetedPushService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class CareerPostController extends Controller
{
    public function __construct(
        protected TargetedPushService $pushService,
    ) {}

    public function publicEvents(): JsonResponse
    {
        $events = CareerPost::approved()
            ->whereIn('category', ['event_mahasiswa', 'event_umum'])
            ->where('event_phase', 'completed')
            ->with('author:id,name')
            ->latest()
            ->paginate(6);

        return response()->json($events);
    }

    /**
     * List career posts (approved only for non-admin, all for admin).
     */
    public function index(Request $request): JsonResponse
    {
        $query = CareerPost::with('author:id,name');

        if (! $request->user()->isAdmin()) {
            $query->approved();
        }

        // Optional filters
        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        if ($request->has('status') && $request->user()->isAdmin()) {
            $query->where('status', $request->status);
        }

        if ($request->has('event_phase') && $this->isEventCategory($request->input('category'))) {
            $query->where('event_phase', $request->string('event_phase')->toString());
        }

        $posts = $query->latest()->paginate(15);

        return response()->json($posts);
    }

    /**
     * Create a new career post.
     */
    public function store(Request $request): JsonResponse
    {
        $isEvent = $this->isEventCategory($request->input('category'));
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category' => ['required', Rule::in([
                'magang', 'full_time', 'part_time', 'beasiswa', 'event_mahasiswa', 'event_umum',
            ])],
            'company_or_institution' => 'required|string|max:255',
            'description' => 'required|string',
            'registration_link' => 'nullable|url|max:255',
            'event_phase' => [
                Rule::requiredIf($isEvent && $request->user()->isAdmin()),
                'nullable',
                Rule::in(['upcoming', 'completed']),
            ],
            'event_image' => [
                Rule::prohibitedIf(! $isEvent || ! $request->user()->isAdmin()),
                'nullable',
                'image',
                'max:5120',
            ],
        ]);

        $validated['author_id'] = $request->user()->id;
        if ($isEvent && ! $request->user()->isAdmin() && empty($validated['event_phase'])) {
            $validated['event_phase'] = 'upcoming';
        }
        unset($validated['event_image']);
        if (! $isEvent) {
            unset($validated['event_phase']);
        }

        // Admin posts are auto-approved
        $validated['status'] = $request->user()->isAdmin() ? 'approved' : 'pending';

        $post = DB::transaction(function () use ($request, $validated, $isEvent) {
            $post = CareerPost::create($validated);
            if ($isEvent && $request->user()->isAdmin() && $request->hasFile('event_image')) {
                $imagePath = $request->file('event_image')->storePublicly('events', 'public');
                if (! $imagePath) {
                    abort(500, 'Foto event gagal disimpan.');
                }
                $post->update(['event_image_path' => $imagePath]);
            }

            return $post;
        });

        // Events are listed in the portal without sending WhatsApp notifications.
        if ($post->status === 'approved' && ! $this->isEvent($post)) {
            $this->pushService->dispatchForCareerPost($post);
        }

        return response()->json([
            'message' => 'Informasi karir berhasil dibuat.',
            'post' => $post->load('author:id,name'),
        ], 201);
    }

    /**
     * Show a specific career post.
     */
    public function show(CareerPost $careerPost): JsonResponse
    {
        return response()->json([
            'post' => $careerPost->load('author:id,name'),
        ]);
    }

    /**
     * Update a career post (Admin: approve/reject/edit).
     */
    public function update(Request $request, CareerPost $careerPost): JsonResponse
    {
        $isEvent = $this->isEvent($careerPost);
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'category' => ['sometimes', Rule::in([
                'magang', 'full_time', 'part_time', 'beasiswa', 'event_mahasiswa', 'event_umum',
            ])],
            'company_or_institution' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'registration_link' => 'sometimes|nullable|url|max:255',
            'event_phase' => [
                Rule::prohibitedIf(! $isEvent),
                'sometimes',
                Rule::in(['upcoming', 'completed']),
            ],
            'event_image' => [
                Rule::prohibitedIf(! $isEvent),
                'sometimes',
                'nullable',
                'image',
                'max:5120',
            ],
            'status' => ['sometimes', Rule::in(['pending', 'approved', 'rejected'])],
        ]);

        $image = $request->file('event_image');
        unset($validated['event_image']);
        $wasNotApproved = $careerPost->status !== 'approved';
        $careerPost->update($validated);
        if ($image) {
            $imagePath = $image->storePublicly('events', 'public');
            if (! $imagePath) {
                abort(500, 'Foto event gagal disimpan.');
            }
            $previousImage = $careerPost->event_image_path;
            $careerPost->update(['event_image_path' => $imagePath]);
            if ($previousImage) {
                Storage::disk('public')->delete($previousImage);
            }
        }

        // Event approvals must not generate WhatsApp notifications.
        if ($wasNotApproved && $careerPost->status === 'approved' && ! $this->isEvent($careerPost)) {
            $this->pushService->dispatchForCareerPost($careerPost);
        }

        return response()->json([
            'message' => 'Informasi karir berhasil diperbarui.',
            'post' => $careerPost->fresh()->load('author:id,name'),
        ]);
    }

    /**
     * Delete a career post (Admin only).
     */
    public function destroy(CareerPost $careerPost): JsonResponse
    {
        $imagePath = $careerPost->event_image_path;
        $careerPost->delete();
        if ($imagePath) {
            Storage::disk('public')->delete($imagePath);
        }

        return response()->json([
            'message' => 'Informasi karir berhasil dihapus.',
        ]);
    }

    private function isEvent(CareerPost $careerPost): bool
    {
        return $this->isEventCategory($careerPost->category);
    }

    private function isEventCategory(?string $category): bool
    {
        return in_array($category, ['event_mahasiswa', 'event_umum'], true);
    }
}
