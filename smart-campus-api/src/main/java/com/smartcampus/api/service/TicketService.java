package com.smartcampus.api.service;

import com.smartcampus.api.dto.*;
import com.smartcampus.api.exception.TicketNotFoundException;
import com.smartcampus.api.exception.UserNotFoundException;
import com.smartcampus.api.model.*;
import com.smartcampus.api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TicketCommentRepository ticketCommentRepository;
    private final TicketImageRepository ticketImageRepository;
    private final UserRepository userRepository;

    @Value("${app.upload.tickets-dir:./uploads/tickets}")
    private String uploadDir;

    public TicketResponseDTO createTicket(TicketRequestDTO dto, User currentUser) {
        Ticket ticket = Ticket.builder()
                .title(dto.getTitle())
                .location(dto.getLocation())
                .category(dto.getCategory())
                .description(dto.getDescription())
                .priority(dto.getPriority())
                .status(TicketStatus.OPEN)
                .preferredContactEmail(dto.getPreferredContactEmail())
                .preferredContactPhone(dto.getPreferredContactPhone())
                .createdBy(currentUser)
                .build();
        return convertToDTO(ticketRepository.save(ticket));
    }

    public List<TicketResponseDTO> getAllTickets(User currentUser) {
        List<Ticket> tickets;
        if (currentUser.getRole() == Role.ADMIN || currentUser.getRole() == Role.LECTURER) {
            tickets = ticketRepository.findAllByOrderByCreatedAtDesc();
        } else {
            tickets = ticketRepository.findByCreatedByOrderByCreatedAtDesc(currentUser);
        }
        return tickets.stream().map(this::convertToDTO).toList();
    }

    public TicketResponseDTO getTicketById(Long id, User currentUser) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new TicketNotFoundException(id));
        if (currentUser.getRole() == Role.STUDENT && !ticket.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You do not have permission to view this ticket");
        }
        return convertToDTO(ticket);
    }

    public TicketResponseDTO updateStatus(Long id, TicketStatusUpdateDTO dto, User currentUser) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new TicketNotFoundException(id));

        validateStatusTransition(ticket.getStatus(), dto.getStatus(), currentUser.getRole());

        ticket.setStatus(dto.getStatus());

        if (dto.getStatus() == TicketStatus.REJECTED) {
            if (dto.getRejectionReason() == null || dto.getRejectionReason().isBlank()) {
                throw new IllegalArgumentException("Rejection reason is required when rejecting a ticket");
            }
            ticket.setRejectionReason(dto.getRejectionReason());
        }

        if (dto.getResolutionNotes() != null && !dto.getResolutionNotes().isBlank()) {
            ticket.setResolutionNotes(dto.getResolutionNotes());
        }

        return convertToDTO(ticketRepository.save(ticket));
    }

    private void validateStatusTransition(TicketStatus current, TicketStatus next, Role role) {
        if (next == TicketStatus.REJECTED) {
            if (role != Role.ADMIN) throw new AccessDeniedException("Only admins can reject tickets");
            return;
        }
        if (next == TicketStatus.CLOSED) {
            if (role != Role.ADMIN) throw new AccessDeniedException("Only admins can close tickets");
            if (current != TicketStatus.RESOLVED)
                throw new IllegalArgumentException("Ticket must be RESOLVED before it can be closed");
            return;
        }
        if (next == TicketStatus.IN_PROGRESS) {
            if (role == Role.STUDENT) throw new AccessDeniedException("Students cannot update ticket status");
            if (current != TicketStatus.OPEN)
                throw new IllegalArgumentException("Ticket must be OPEN to move to IN_PROGRESS");
            return;
        }
        if (next == TicketStatus.RESOLVED) {
            if (role == Role.STUDENT) throw new AccessDeniedException("Students cannot resolve tickets");
            if (current != TicketStatus.IN_PROGRESS)
                throw new IllegalArgumentException("Ticket must be IN_PROGRESS before it can be resolved");
            return;
        }
        throw new IllegalArgumentException("Invalid status transition from " + current + " to " + next);
    }

    public TicketResponseDTO assignTicket(Long id, TicketAssignDTO dto, User currentUser) {
        if (currentUser.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only admins can assign tickets");
        }
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new TicketNotFoundException(id));
        User assignee = userRepository.findById(dto.getAssignedToId())
                .orElseThrow(() -> new UserNotFoundException(dto.getAssignedToId()));
        ticket.setAssignedTo(assignee);
        return convertToDTO(ticketRepository.save(ticket));
    }

    public void deleteTicket(Long id, User currentUser) {
        if (currentUser.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only admins can delete tickets");
        }
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new TicketNotFoundException(id));
        for (TicketImage image : ticket.getImages()) {
            deleteImageFile(image.getStoredFileName(), id);
        }
        ticketRepository.delete(ticket);
    }

    public TicketResponseDTO uploadImage(Long ticketId, MultipartFile file, User currentUser) throws IOException {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException(ticketId));

        if (currentUser.getRole() == Role.STUDENT && !ticket.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You can only upload images to your own tickets");
        }

        long imageCount = ticketImageRepository.countByTicket(ticket);
        if (imageCount >= 3) {
            throw new IllegalArgumentException("Maximum 3 images allowed per ticket");
        }

        String originalFileName = StringUtils.cleanPath(
                file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload"
        );
        String storedFileName = UUID.randomUUID() + "_" + originalFileName;

        Path uploadPath = Paths.get(uploadDir, ticketId.toString());
        Files.createDirectories(uploadPath);
        Files.copy(file.getInputStream(), uploadPath.resolve(storedFileName), StandardCopyOption.REPLACE_EXISTING);

        TicketImage image = TicketImage.builder()
                .ticket(ticket)
                .originalFileName(originalFileName)
                .storedFileName(storedFileName)
                .contentType(file.getContentType() != null ? file.getContentType() : "application/octet-stream")
                .fileSize(file.getSize())
                .build();
        ticketImageRepository.save(image);

        return convertToDTO(ticketRepository.findById(ticketId).orElseThrow());
    }

    public byte[] getImageData(Long imageId) throws IOException {
        TicketImage image = ticketImageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Image not found with id: " + imageId));
        Path imagePath = Paths.get(uploadDir, image.getTicket().getId().toString(), image.getStoredFileName());
        return Files.readAllBytes(imagePath);
    }

    public String getImageContentType(Long imageId) {
        return ticketImageRepository.findById(imageId)
                .map(TicketImage::getContentType)
                .orElseThrow(() -> new RuntimeException("Image not found with id: " + imageId));
    }

    public void deleteImage(Long ticketId, Long imageId, User currentUser) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException(ticketId));
        TicketImage image = ticketImageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Image not found with id: " + imageId));

        if (currentUser.getRole() == Role.STUDENT && !ticket.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You can only delete images from your own tickets");
        }

        deleteImageFile(image.getStoredFileName(), ticketId);
        ticketImageRepository.delete(image);
    }

    private void deleteImageFile(String storedFileName, Long ticketId) {
        try {
            Path imagePath = Paths.get(uploadDir, ticketId.toString(), storedFileName);
            Files.deleteIfExists(imagePath);
        } catch (IOException ignored) {
        }
    }

    public TicketCommentResponseDTO addComment(Long ticketId, TicketCommentRequestDTO dto, User currentUser) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException(ticketId));

        if (currentUser.getRole() == Role.STUDENT && !ticket.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You can only comment on your own tickets");
        }

        TicketComment comment = TicketComment.builder()
                .ticket(ticket)
                .author(currentUser)
                .content(dto.getContent())
                .build();
        return convertCommentToDTO(ticketCommentRepository.save(comment));
    }

    public TicketCommentResponseDTO editComment(Long ticketId, Long commentId, TicketCommentRequestDTO dto, User currentUser) {
        ticketRepository.findById(ticketId).orElseThrow(() -> new TicketNotFoundException(ticketId));
        TicketComment comment = ticketCommentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found with id: " + commentId));

        if (!comment.getAuthor().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You can only edit your own comments");
        }

        comment.setContent(dto.getContent());
        return convertCommentToDTO(ticketCommentRepository.save(comment));
    }

    public void deleteComment(Long ticketId, Long commentId, User currentUser) {
        ticketRepository.findById(ticketId).orElseThrow(() -> new TicketNotFoundException(ticketId));
        TicketComment comment = ticketCommentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found with id: " + commentId));

        if (!comment.getAuthor().getId().equals(currentUser.getId()) && currentUser.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("You can only delete your own comments");
        }

        ticketCommentRepository.delete(comment);
    }

    private TicketResponseDTO convertToDTO(Ticket ticket) {
        List<Long> imageIds = ticket.getImages().stream()
                .map(TicketImage::getId)
                .toList();
        List<TicketCommentResponseDTO> comments = ticket.getComments().stream()
                .map(this::convertCommentToDTO)
                .toList();
        return new TicketResponseDTO(
                ticket.getId(),
                ticket.getTitle(),
                ticket.getLocation(),
                ticket.getCategory(),
                ticket.getDescription(),
                ticket.getPriority(),
                ticket.getStatus(),
                ticket.getPreferredContactEmail(),
                ticket.getPreferredContactPhone(),
                ticket.getRejectionReason(),
                ticket.getResolutionNotes(),
                ticket.getCreatedBy().getId(),
                ticket.getCreatedBy().getName(),
                ticket.getAssignedTo() != null ? ticket.getAssignedTo().getId() : null,
                ticket.getAssignedTo() != null ? ticket.getAssignedTo().getName() : null,
                imageIds,
                comments,
                ticket.getCreatedAt(),
                ticket.getUpdatedAt()
        );
    }

    private TicketCommentResponseDTO convertCommentToDTO(TicketComment comment) {
        return new TicketCommentResponseDTO(
                comment.getId(),
                comment.getContent(),
                comment.getAuthor().getId(),
                comment.getAuthor().getName(),
                comment.getCreatedAt(),
                comment.getUpdatedAt()
        );
    }
}
