<?php

namespace App\Repositories;

use App\SprintLog;

class SprintLogRepository
{
    protected $sprintLog;

    public function __construct(SprintLog $sprintLog) 
    {
        $this->sprintLog = $sprintLog;
    }

    public function find()
    {
        return $this->sprintLog->get();
    }

    public function findBy(SprintLog $sprintLog)
    {
        return $sprintLog;
    }

    public function findAllById($id)
    {
        return $this->sprintLog->where('sprint_id', $id)->get();
    }
}