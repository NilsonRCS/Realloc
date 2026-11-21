import { CreateRelocatedUseCase } from "@/application/use-cases/relocated/create-relocated.use-case.js";
import { GetRelocatedUseCase } from "@/application/use-cases/relocated/get-relocated.use-case.js";
import { ListRelocatedUseCase } from "@/application/use-cases/relocated/list-relocated.use-case.js";
import { GetMyRelocatedUseCase } from "@/application/use-cases/relocated/get-my-relocated.use-case.js";
import { SubmitRelocatedFormUseCase } from "@/application/use-cases/relocated/submit-relocated-form.use-case.js";
import { GetMyRelocatedController } from "@/presentation/http/controllers/relocated/get-my-relocated.controller.js";
import { SubmitRelocatedFormController } from "@/presentation/http/controllers/relocated/submit-relocated-form.controller.js";
import { UpdateRelocatedUseCase } from "@/application/use-cases/relocated/update-relocated.use-case.js";
import { CreateRelocatedController } from "@/presentation/http/controllers/relocated/create-relocated.controller.js";
import { GetRelocatedController } from "@/presentation/http/controllers/relocated/get-relocated.controller.js";
import { ListRelocatedController } from "@/presentation/http/controllers/relocated/list-relocated.controller.js";
import { UpdateRelocatedController } from "@/presentation/http/controllers/relocated/update-relocated.controller.js";
import { makeRecruiterRepository, makeRelocatedRepository } from "./repositories/profile-repositories.factory.js";
import { makeUserRepository } from "./repositories/user-repository.factory.js";

export function makeRelocatedControllers() {
  const userRepository = makeUserRepository();
  const recruiterRepository = makeRecruiterRepository();
  const relocatedRepository = makeRelocatedRepository();

  return {
    createRelocated: new CreateRelocatedController(
      new CreateRelocatedUseCase(userRepository, recruiterRepository, relocatedRepository)
    ),
    listRelocated: new ListRelocatedController(new ListRelocatedUseCase(recruiterRepository, relocatedRepository)),
    getRelocated: new GetRelocatedController(new GetRelocatedUseCase(recruiterRepository, relocatedRepository)),
    getMyRelocated: new GetMyRelocatedController(new GetMyRelocatedUseCase(relocatedRepository)),
    submitRelocatedForm: new SubmitRelocatedFormController(
      new SubmitRelocatedFormUseCase(userRepository, recruiterRepository, relocatedRepository)
    ),
    updateRelocated: new UpdateRelocatedController(new UpdateRelocatedUseCase(recruiterRepository, relocatedRepository)),
  };
}
