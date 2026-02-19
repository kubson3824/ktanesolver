package ktanesolver.service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import ktanesolver.dto.RoundEventDto;
import ktanesolver.entity.RoundEntity;
import ktanesolver.entity.RoundEventEntity;
import ktanesolver.repository.RoundEventRepository;
import ktanesolver.repository.RoundRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RoundEventService {

	private final RoundRepository roundRepo;
	private final RoundEventRepository roundEventRepo;

	public List<RoundEventDto> getEvents(UUID roundId, Instant since, int limit) {
		RoundEntity round = roundRepo.findById(roundId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Round not found"));
		PageRequest page = PageRequest.of(0, Math.min(limit, 100));
		var pageResult = since != null
			? roundEventRepo.findByRoundAndTimestampAfterOrderByTimestampDesc(round, since, page)
			: roundEventRepo.findByRoundOrderByTimestampDesc(round, page);
		return pageResult.getContent().stream()
			.map(this::toDto)
			.collect(Collectors.toList());
	}

	private RoundEventDto toDto(RoundEventEntity e) {
		return new RoundEventDto(e.getId(), e.getTimestamp(), e.getType(), e.getPayload());
	}
}
