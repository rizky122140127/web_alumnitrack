<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WaNotification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'career_post_id',
        'notification_type',
        'message_content',
        'status',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'sent_at' => 'datetime',
        ];
    }

    // ── Relationships ───────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function careerPost(): BelongsTo
    {
        return $this->belongsTo(CareerPost::class);
    }

    // ── Scopes ──────────────────────────────────────────────────

    public function scopeQueued($query)
    {
        return $query->where('status', 'queued');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }
}
