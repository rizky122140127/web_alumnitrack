<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CareerPost extends Model
{
    use HasFactory;

    protected $fillable = [
        'author_id',
        'title',
        'category',
        'company_or_institution',
        'description',
        'registration_link',
        'status',
    ];

    // ── Relationships ───────────────────────────────────────────

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function waNotifications(): HasMany
    {
        return $this->hasMany(WaNotification::class);
    }

    // ── Scopes ──────────────────────────────────────────────────

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }
}
