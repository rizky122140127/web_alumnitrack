<?php

namespace App\Http\Controllers;

use App\Models\TracerAnswer;
use App\Models\TracerQuestion;
use App\Models\AlumniProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TracerQuestionController extends Controller
{
    /**
     * List all tracer questions (ordered).
     */
    public function index(): JsonResponse
    {
        $questions = TracerQuestion::orderBy('order_number')->get();

        return response()->json([
            'questions' => $questions,
        ]);
    }

    /**
     * Create a new tracer question (Admin only).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'question_text' => 'required|string',
            'question_type' => 'required|in:text,radio,checkbox,scale',
            'options'       => 'nullable|array',
            'is_required'   => 'sometimes|boolean',
            'order_number'  => 'required|integer|min:1',
        ]);

        $question = TracerQuestion::create($validated);

        return response()->json([
            'message'  => 'Pertanyaan berhasil dibuat.',
            'question' => $question,
        ], 201);
    }

    /**
     * Show a specific question.
     */
    public function show(TracerQuestion $tracerQuestion): JsonResponse
    {
        return response()->json([
            'question' => $tracerQuestion,
        ]);
    }

    /**
     * Update a tracer question (Admin only).
     */
    public function update(Request $request, TracerQuestion $tracerQuestion): JsonResponse
    {
        $validated = $request->validate([
            'question_text' => 'sometimes|string',
            'question_type' => 'sometimes|in:text,radio,checkbox,scale',
            'options'       => 'nullable|array',
            'is_required'   => 'sometimes|boolean',
            'order_number'  => 'sometimes|integer|min:1',
        ]);

        $tracerQuestion->update($validated);

        return response()->json([
            'message'  => 'Pertanyaan berhasil diperbarui.',
            'question' => $tracerQuestion->fresh(),
        ]);
    }

    /**
     * Delete a tracer question (Admin only).
     */
    public function destroy(TracerQuestion $tracerQuestion): JsonResponse
    {
        $tracerQuestion->delete();

        return response()->json([
            'message' => 'Pertanyaan berhasil dihapus.',
        ]);
    }
}
