package com.smartcampus.api.repository;

import com.smartcampus.api.model.Ticket;
import com.smartcampus.api.model.TicketImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketImageRepository extends JpaRepository<TicketImage, Long> {
    List<TicketImage> findByTicket(Ticket ticket);
    long countByTicket(Ticket ticket);
}
