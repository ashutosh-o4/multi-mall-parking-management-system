package com.ashu.parking_backend.domain.entry;

import com.ashu.parking_backend.domain.entry.dto.CreateEntryRequest;
import com.ashu.parking_backend.domain.entry.dto.EntryResponse;

import java.util.List;

public interface VehicleEntryService {
    EntryResponse createEntry(CreateEntryRequest request);
    EntryResponse processExit(Long entryId);
    List<EntryResponse> getActiveEntriesByMallId(Long mallId);
}
