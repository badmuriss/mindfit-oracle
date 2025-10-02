package com.mindfit.api.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.time.LocalDate;
import java.time.Period;

public class AgeValidator implements ConstraintValidator<ValidAge, LocalDate> {
    
    private int minAge;
    private int maxAge;
    
    @Override
    public void initialize(ValidAge constraintAnnotation) {
        this.minAge = constraintAnnotation.min();
        this.maxAge = constraintAnnotation.max();
    }
    
    @Override
    public boolean isValid(LocalDate birthDate, ConstraintValidatorContext context) {
        if (birthDate == null) {
            return true; // @NotNull já trata a validação de nulos
        }
        
        LocalDate now = LocalDate.now();
        if (birthDate.isAfter(now)) {
            return false;
        }
        
        int age = Period.between(birthDate, now).getYears();
        return age >= minAge && age <= maxAge;
    }
}