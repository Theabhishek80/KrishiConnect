package com.krishiconnect.repository;
import com.krishiconnect.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface AddressRepository extends JpaRepository<Address,Long>{
 List<Address> findByUserIdOrderByDefaultAddressDescIdDesc(Long userId);
 long countByUserId(Long userId);
}
