<?php

namespace App\Http\Controllers;

use App\Models\TracerAnswer;
use App\Models\TracerQuestion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TracerAnswerController extends Controller
{
    /**
     * Submit answers to tracer study (Alumni).
     * Accepts an array of {question_id, answer_value} pairs.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'answers'                 => 'required|array|min:1',
            'answers.*.question_id'   => 'required|exists:tracer_questions,id',
            'answers.*.answer_value'  => 'required|string',
        ]);

        $user = $request->user();
        $now  = now();

        foreach ($validated['answers'] as $answerData) {
            TracerAnswer::updateOrCreate(
                [
                    'user_id'     => $user->id,
                    'question_id' => $answerData['question_id'],
                ],
                [
                    'answer_value' => $answerData['answer_value'],
                    'submitted_at' => $now,
                ]
            );
        }

        return response()->json([
            'message' => 'Jawaban tracer study berhasil disimpan.',
        ]);
    }

    /**
     * Get current user's answers.
     */
    public function myAnswers(Request $request): JsonResponse
    {
        $answers = TracerAnswer::where('user_id', $request->user()->id)
            ->with('question')
            ->get();

        return response()->json([
            'answers' => $answers,
        ]);
    }
}
