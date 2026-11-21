import { CreateRecruiterUseCase } from "@/application/use-cases/recruiter/create-recruiter.use-case.js";
import { GetRecruiterUseCase } from "@/application/use-cases/recruiter/get-recruiter.use-case.js";
import { ListRecruitersUseCase } from "@/application/use-cases/recruiter/list-recruiters.use-case.js";
import { ListAvailableRecruitersUseCase } from "@/application/use-cases/recruiter/list-available-recruiters.use-case.js";
import { ListAvailableRecruitersController } from "@/presentation/http/controllers/recruiter/list-available-recruiters.controller.js";
import { UpdateRecruiterUseCase } from "@/application/use-cases/recruiter/update-recruiter.use-case.js";
import { CreateRecruiterController } from "@/presentation/http/controllers/recruiter/create-recruiter.controller.js";
import { GetRecruiterController } from "@/presentation/http/controllers/recruiter/get-recruiter.controller.js";
import { ListRecruitersController } from "@/presentation/http/controllers/recruiter/list-recruiters.controller.js";
import { UpdateRecruiterController } from "@/presentation/http/controllers/recruiter/update-recruiter.controller.js";
import { makeRecruiterRepository } from "./repositories/profile-repositories.factory.js";
import { makeUserRepository } from "./repositories/user-repository.factory.js";

export function makeRecruiterControllers() {
  const userRepository = makeUserRepository();
  const recruiterRepository = makeRecruiterRepository();

  return {
    createRecruiter: new CreateRecruiterController(new CreateRecruiterUseCase(userRepository, recruiterRepository)),
    listRecruiters: new ListRecruitersController(new ListRecruitersUseCase(recruiterRepository)),
    getRecruiter: new GetRecruiterController(new GetRecruiterUseCase(recruiterRepository)),
    listAvailableRecruiters: new ListAvailableRecruitersController(new ListAvailableRecruitersUseCase(recruiterRepository)),
    updateRecruiter: new UpdateRecruiterController(new UpdateRecruiterUseCase(recruiterRepository)),
  };
}
