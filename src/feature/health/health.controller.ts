import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("Health")
@Controller('health')
export class HealthController
{
    @Get()
    getHealth()
    {
        return{
            success: true,
            message: "Health check successful"
        }
    }
}