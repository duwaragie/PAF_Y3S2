package com.smartcampus.api.service;

import com.smartcampus.api.dto.CourseSectionDTO;
import com.smartcampus.api.dto.CreateCourseSectionRequest;
import com.smartcampus.api.exception.BadRequestException;
import com.smartcampus.api.exception.ResourceNotFoundException;
import com.smartcampus.api.exception.UserNotFoundException;
import com.smartcampus.api.model.CourseOffering;
import com.smartcampus.api.model.CourseSection;
import com.smartcampus.api.model.Role;
import com.smartcampus.api.model.User;
import com.smartcampus.api.repository.CourseOfferingRepository;
import com.smartcampus.api.repository.CourseSectionRepository;
import com.smartcampus.api.repository.EnrollmentRepository;
import com.smartcampus.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseSectionService {

    private final CourseSectionRepository courseSectionRepository;
    private final CourseOfferingRepository courseOfferingRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;

    public CourseSectionDTO create(Long offeringId, CreateCourseSectionRequest request) {
        CourseOffering offering = courseOfferingRepository.findById(offeringId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Course offering " + offeringId + " not found"));

        courseSectionRepository.findByOfferingIdAndLabel(offeringId, request.getLabel().trim())
                .ifPresent(existing -> {
                    throw new BadRequestException(
                            "A section named " + request.getLabel() + " already exists in this offering.");
                });

        CourseSection section = CourseSection.builder()
                .offering(offering)
                .label(request.getLabel().trim())
                .capacity(request.getCapacity())
                .lecturer(resolveLecturer(request.getLecturerId()))
                .build();

        return toDTO(courseSectionRepository.save(section));
    }

    public CourseSectionDTO update(Long sectionId, CreateCourseSectionRequest request) {
        CourseSection section = courseSectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Section " + sectionId + " not found"));

        String newLabel = request.getLabel().trim();
        if (!section.getLabel().equals(newLabel)) {
            courseSectionRepository
                    .findByOfferingIdAndLabel(section.getOffering().getId(), newLabel)
                    .filter(other -> !other.getId().equals(sectionId))
                    .ifPresent(other -> {
                        throw new BadRequestException(
                                "Another section named " + newLabel + " already exists in this offering.");
                    });
        }

        // Guard: can't shrink below current enrolled count
        long active = enrollmentRepository.countActiveBySectionId(sectionId);
        if (request.getCapacity() < active) {
            throw new BadRequestException(
                    "Cannot set capacity below currently enrolled students (" + active + ").");
        }

        section.setLabel(newLabel);
        section.setCapacity(request.getCapacity());
        section.setLecturer(resolveLecturer(request.getLecturerId()));
        return toDTO(courseSectionRepository.save(section));
    }

    public void delete(Long sectionId) {
        CourseSection section = courseSectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Section " + sectionId + " not found"));
        long active = enrollmentRepository.countActiveBySectionId(sectionId);
        if (active > 0) {
            throw new BadRequestException(
                    "Cannot delete a section with enrolled students. Move them to another section first.");
        }
        courseSectionRepository.delete(section);
    }

    public List<CourseSectionDTO> listByOffering(Long offeringId) {
        return courseSectionRepository.findByOfferingId(offeringId).stream()
                .map(this::toDTO).toList();
    }

    public List<CourseSectionDTO> listByLecturer(Long lecturerId) {
        return courseSectionRepository.findByLecturerId(lecturerId).stream()
                .map(this::toDTO).toList();
    }

    public CourseSectionDTO getById(Long sectionId) {
        return toDTO(courseSectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Section " + sectionId + " not found")));
    }

    private User resolveLecturer(Long lecturerId) {
        if (lecturerId == null) return null;
        User lecturer = userRepository.findById(lecturerId)
                .orElseThrow(() -> new UserNotFoundException(lecturerId));
        if (lecturer.getRole() != Role.LECTURER && lecturer.getRole() != Role.ADMIN) {
            throw new BadRequestException("Assigned user must be a LECTURER or ADMIN.");
        }
        return lecturer;
    }

    CourseSectionDTO toDTO(CourseSection s) {
        int enrolled = (int) enrollmentRepository.countActiveBySectionId(s.getId());
        int capacity = s.getCapacity() != null ? s.getCapacity() : 0;
        CourseOffering offering = s.getOffering();
        return CourseSectionDTO.builder()
                .id(s.getId())
                .offeringId(offering.getId())
                .courseCode(offering.getCode())
                .courseTitle(offering.getTitle())
                .semester(offering.getSemester())
                .credits(offering.getCredits())
                .label(s.getLabel())
                .capacity(capacity)
                .enrolledCount(enrolled)
                .seatsAvailable(Math.max(0, capacity - enrolled))
                .lecturerId(s.getLecturer() != null ? s.getLecturer().getId() : null)
                .lecturerName(s.getLecturer() != null ? s.getLecturer().getName() : null)
                .build();
    }
}
