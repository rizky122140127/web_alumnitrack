<?php

namespace App\Http\Controllers;

use App\Models\CareerPost;
use App\Services\TargetedPushService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CareerPostController extends Controller
{
    public function __construct(
        protected TargetedPushService $pushService,
    ) {}

    /**
     * List career posts (approved only for non-admin, all for admin).
     */
    public function index(Request $request): JsonResponse
    {
        $query = CareerPost::with('author:id,name');

        if (!$request->user()->isAdmin()) {
            $query->approved();
        }

        // Optional filters
        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        if ($request->has('status') && $request->user()->isAdmin()) {
            $query->where('status', $request->status);
        }

        $posts = $query->latest()->paginate(15);

        return response()->json($posts);
    }

    /**
     * Create a new career post.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'                  => 'required|string|max:255',
            'category'               => ['required', Rule::in(['magang', 'full_time', 'part_time', 'beasiswa'])],
            'company_or_institution' => 'required|string|max:255',
            'description'            => 'required|string',
            'registration_link'      => 'nullable|url|max:255',
        ]);

        $validated['author_id'] = $request->user()->id;

        // Admin posts are auto-approved
        $validated['status'] = $request->user()->isAdmin() ? 'approved' : 'pending';

        $post = CareerPost::create($validated);

        // If auto-approved (admin), trigger targeted push
        if ($post->status === 'approved') {
            $this->pushService->dispatchForCareerPost($post);
        }

        return response()->json([
            'message' => 'Informasi karir berhasil dibuat.',
            'post'    => $post->load('author:id,name'),
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
        $validated = $request->validate([
            'title'                  => 'sometimes|string|max:255',
            'category'               => ['sometimes', Rule::in(['magang', 'full_time', 'part_time', 'beasiswa'])],
            'company_or_institution' => 'sometimes|string|max:255',
            'description'            => 'sometimes|string',
            'registration_link'      => 'sometimes|nullable|url|max:255',
            'status'                 => ['sometimes', Rule::in(['pending', 'approved', 'rejected'])],
        ]);

        $wasNotApproved = $careerPost->status !== 'approved';
        $careerPost->update($validated);

        // If newly approved, trigger targeted push notifications
        if ($wasNotApproved && $careerPost->status === 'approved') {
            $this->pushService->dispatchForCareerPost($careerPost);
        }

        return response()->json([
            'message' => 'Informasi karir berhasil diperbarui.',
            'post'    => $careerPost->fresh()->load('author:id,name'),
        ]);
    }

    /**
     * Delete a career post (Admin only).
     */
    public function destroy(CareerPost $careerPost): JsonResponse
    {
        $careerPost->delete();

        return response()->json([
            'message' => 'Informasi karir berhasil dihapus.',
        ]);
    }
}
