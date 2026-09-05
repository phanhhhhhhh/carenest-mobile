package com.carenest.backend.entity;

public enum BroadcastStatus {
    /** Still walking the sequential list of free members. */
    ACTIVE,
    /** A family member acknowledged — done. */
    ACKNOWLEDGED,
    /** Free list exhausted or 2 h elapsed — fanned out to the whole family. */
    ESCALATED
}
