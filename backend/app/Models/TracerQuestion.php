<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TracerQuestion extends Model
{
    use HasFactory;

    protected $fillable = [
        'question_text',
        'question_type',
        'options',
        'is_required',
        'order_number',
    ];

    protected function casts(): array
    {
        return [
            'options' => 'array',
            'is_required' => 'boolean',
            'order_number' => 'integer',
        ];
    }

    // ── Relationships ───────────────────────────────────────────

    public function answers(): HasMany
    {
        return $this->hasMany(TracerAnswer::class, 'question_id');
    }
}
