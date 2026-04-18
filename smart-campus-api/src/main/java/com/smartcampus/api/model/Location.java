package com.smartcampus.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "locations", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"block", "floor", "room_number"})
})
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String block;

    @Column(nullable = false)
    private Integer floor;

    @Column(name = "room_number", nullable = false, length = 50)
    private String roomNumber;

    @Column(name = "room_type", nullable = false, length = 100)
    private String roomType; // e.g., NORMAL, AC, LAB

    public String getDisplayName() {
        return block + " - Floor " + floor + " - Room " + roomNumber + " (" + roomType + ")";
    }
}
