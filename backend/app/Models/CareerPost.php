<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

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
        'event_phase',
        'event_image_path',
        'status',
    ];

    protected $appends = ['event_image_url'];

    protected function eventImageUrl(): Attribute
    {
        return Attribute::get(
            fn (): ?string => $this->event_image_path
                ? Storage::disk('public')->url($this->event_image_path)
                : null
        );
    }

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
