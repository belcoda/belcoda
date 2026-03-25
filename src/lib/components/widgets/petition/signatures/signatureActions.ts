import { appState } from '$lib/state.svelte';
import { z } from '$lib/zero.svelte';
import { mutators } from '$lib/zero/mutate/client_mutators';
import { v7 as uuidv7 } from 'uuid';

export function handleAddPerson({
	petitionId,
	personIds
}: {
	petitionId: string;
	personIds: string[];
}) {
	personIds.forEach((personId) => {
		z.mutate(
			mutators.petitionSignature.create({
				input: {
					petitionId,
					personId,
					details: {
						channel: {
							type: 'adminPanel'
						}
					}
				},
				metadata: {
					petitionSignatureId: uuidv7(),
					organizationId: appState.organizationId,
					petitionId,
					personId
				}
			})
		);
	});
}

export function handleDeleteSignature({
	petitionSignatureId,
	organizationId,
	petitionId,
	personId
}: {
	petitionSignatureId: string;
	organizationId: string;
	petitionId: string;
	personId: string;
}) {
	z.mutate(
		mutators.petitionSignature.delete({
			metadata: {
				petitionSignatureId,
				organizationId,
				petitionId,
				personId
			}
		})
	);
}
