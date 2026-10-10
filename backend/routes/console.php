<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule Tracer Study WA reminders every Monday morning at 08:00
Schedule::command('alumni:send-tracer-reminders')->weeklyOn(1, '08:00');

