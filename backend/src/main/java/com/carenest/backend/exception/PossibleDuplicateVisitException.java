package com.carenest.backend.exception;

public class PossibleDuplicateVisitException extends RuntimeException {

    public static final String CODE = "POSSIBLE_DUPLICATE_VISIT";
    public static final String MESSAGE =
        "A visit by this family member is already recorded for this date.";

    public PossibleDuplicateVisitException() {
        super(MESSAGE);
    }
}
