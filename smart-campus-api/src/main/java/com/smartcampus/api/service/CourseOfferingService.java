package com.smartcampus.api.service;

import com.smartcampus.api.dto.CourseOfferingDTO;
import com.smartcampus.api.dto.CourseSectionDTO;
import com.smartcampus.api.dto.CreateCourseOfferingRequest;
import com.smartcampus.api.exception.BadRequestException;
import com.smartcampus.api.exception.ResourceNotFoundException;
import com.smartcampus.api.model.CourseOffering;
import com.smartcampus.api.model.CourseOfferingStatus;
import com.smartcampus.api.model.CourseSection;
import com.smartcampus.api.repository.CourseOfferingRepository;
import com.smartcampus.api.repository.CourseSectionRepository;
import com.smartcampus.api.repository.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseOfferingService {

    private final CourseOfferingRepository courseOfferingRepository;
    private final CourseSectionRepository courseSectionRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CourseSectionService courseSectionService;

    public CourseOfferingDTO create(CreateCourseOfferingRequest request) {
        courseOfferingRepository.findByCodeAndSemester(request.getCode(), request.getSemester())
                .ifPresent(existing -> {
                    throw new BadRequestException(
                            "A course offering with code " + request.getCode()
                                    + " already exists for " + request.getSemester() + ".");
                });

        CourseOffering offering = CourseOffering.builder()
                .code(request.getCode().trim())
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .semester(request.getSemester().trim())
                .credits(request.getCredits())
                .prerequisites(request.getPrerequisites())
                .status(request.getStatus() != null ? request.getStatus() : CourseOfferingStatus.DRAFT)
                .build();

        return toDTO(courseOfferingRepository.save(offering));
    }

    public CourseOfferingDTO update(Long id, CreateCourseOfferingRequest request) {
        CourseOffering offering = courseOfferingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course offering " + id + " not found"));

        boolean codeOrSemesterChanged =
                !offering.getCode().equals(request.getCode())
                        || !offering.getSemester().equals(request.getSemester());

        if (codeOrSemesterChanged) {
            courseOfferingRepository.findByCodeAndSemester(request.getCode(), request.getSemester())
                    .filter(other -> !other.getId().equals(id))
                    .ifPresent(other -> {
                        throw new BadRequestException(
                                "Another offering already uses this code for this semester.");
                    });
        }

        offering.setCode(request.getCode().trim());
        offering.setTitle(request.getTitle().trim());
        offering.setDescription(request.getDescription());
        offering.setSemester(request.getSemester().trim());
        offering.setCredits(request.getCredits());
        offering.setPrerequisites(request.getPrerequisites());
        if (request.getStatus() != null) {
            offering.setStatus(request.getStatus());
        }

        return toDTO(courseOfferingRepository.save(offering));
    }

    public CourseOfferingDTO updateStatus(Long id, CourseOfferingStatus status) {
        CourseOffering offering = courseOfferingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course offering " + id + " not found"));
        offering.setStatus(status);
        return toDTO(courseOfferingRepository.save(offering));
    }

    public void delete(Long id) {
        if (!courseOfferingRepository.existsById(id)) {
            throw new ResourceNotFoundException("Course offering " + id + " not found");
        }
        List<CourseSection> sections = courseSectionRepository.findByOfferingId(id);
        for (CourseSection s : sections) {
            long enrolled = enrollmentRepository.countActiveBySectionId(s.getId());
            if (enrolled > 0) {
                throw new BadRequestException(
                        "Cannot delete an offering with active enrollments. Close it instead.");
            }
        }
        courseSectionRepository.deleteAll(sections);
        courseOfferingRepository.deleteById(id);
    }

    public CourseOfferingDTO getById(Long id) {
        return toDTO(courseOfferingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course offering " + id + " not found")));
    }

    public List<CourseOfferingDTO> list(String semester, CourseOfferingStatus status) {
        List<CourseOffering> offerings;
        if (semester != null && status != null) {
            offerings = courseOfferingRepository.findBySemesterAndStatus(semester, status);
        } else if (semester != null) {
            offerings = courseOfferingRepository.findBySemester(semester);
        } else if (status != null) {
            offerings = courseOfferingRepository.findByStatus(status);
        } else {
            offerings = courseOfferingRepository.findAll();
        }
        return offerings.stream().map(this::toDTO).toList();
    }

    /** Offerings where the given user is the lecturer on at least one section. */
    public List<CourseOfferingDTO> listByLecturer(Long lecturerId) {
        Set<Long> offeringIds = courseSectionRepository.findByLecturerId(lecturerId).stream()
                .map(s -> s.getOffering().getId())
                .collect(Collectors.toCollection(LinkedHashSet::new));
        return offeringIds.stream()
                .map(courseOfferingRepository::findById)
                .filter(java.util.Optional::isPresent)
                .map(java.util.Optional::get)
                .map(this::toDTO)
                .toList();
    }

    CourseOffering getEntityOrThrow(Long id) {
        return courseOfferingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course offering " + id + " not found"));
    }

    CourseOfferingDTO toDTO(CourseOffering offering) {
        List<CourseSection> sections = courseSectionRepository.findByOfferingId(offering.getId());
        sections.sort(Comparator.comparing(CourseSection::getLabel));

        List<CourseSectionDTO> sectionDTOs = sections.stream()
                .map(courseSectionService::toDTO)
                .toList();

        int totalCapacity = sectionDTOs.stream()
                .mapToInt(s -> s.getCapacity() != null ? s.getCapacity() : 0)
                .sum();
        int totalEnrolled = sectionDTOs.stream()
                .mapToInt(s -> s.getEnrolledCount() != null ? s.getEnrolledCount() : 0)
                .sum();

        String lecturerNames = sectionDTOs.stream()
                .map(CourseSectionDTO::getLecturerName)
                .filter(n -> n != null && !n.isBlank())
                .distinct()
                .collect(Collectors.joining(", "));

        return CourseOfferingDTO.builder()
                .id(offering.getId())
                .code(offering.getCode())
                .title(offering.getTitle())
                .description(offering.getDescription())
                .semester(offering.getSemester())
                .credits(offering.getCredits())
                .prerequisites(offering.getPrerequisites())
                .status(offering.getStatus())
                .sections(sectionDTOs)
                .totalCapacity(totalCapacity)
                .totalEnrolled(totalEnrolled)
                .lecturerNames(lecturerNames)
                .build();
    }
}
